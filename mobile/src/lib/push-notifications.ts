import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { unregisterMobileDevice } from '@/lib/mobile-api';

const PUSH_TOKEN_KEY = 'fleetpilot_push_token';

let lastRegisteredPushToken: string | null = null;

export type PushRegistrationResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'simulator' | 'denied' | 'expo_go' | 'missing_project' | 'firebase' | 'error'; message: string };

function resolveProjectId(): string | undefined {
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) {
    return fromExtra;
  }

  const fromEas = (Constants.easConfig as { projectId?: string } | null)?.projectId;
  if (typeof fromEas === 'string' && fromEas.length > 0) {
    return fromEas;
  }

  return undefined;
}

export function isPushSupportedOnDevice(): boolean {
  return Device.isDevice;
}

export function isExpoGoApp(): boolean {
  return Constants.appOwnership === 'expo';
}

export function getPushEnvironmentLabel(): string {
  if (!Device.isDevice) return 'simulator';
  if (isExpoGoApp()) return 'expo_go';
  if (Constants.appOwnership === 'standalone') return 'standalone';
  return 'development';
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as Record<string, unknown>;
    const isChat = data?.type === 'chat_message';

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export function getLastRegisteredPushToken() {
  return lastRegisteredPushToken;
}

export function setLastRegisteredPushToken(token: string | null) {
  lastRegisteredPushToken = token;
  if (token) {
    void SecureStore.setItemAsync(PUSH_TOKEN_KEY, token).catch(() => {});
  } else {
    void SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
  }
}

export async function hydratePushTokenFromStorage(): Promise<string | null> {
  if (lastRegisteredPushToken) {
    return lastRegisteredPushToken;
  }
  try {
    const stored = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (stored) {
      lastRegisteredPushToken = stored;
    }
    return stored;
  } catch {
    return null;
  }
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#4F5BA9',
    sound: 'default',
  });
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      ok: false,
      reason: 'simulator',
      message: 'Push alerts require a physical phone or tablet.',
    };
  }

  // Remote push is not supported in Expo Go (SDK 52+). Avoid calling getExpoPushTokenAsync — it throws.
  if (isExpoGoApp()) {
    return {
      ok: false,
      reason: 'expo_go',
      message: 'Install the FleetPilot APK/dev build for push alerts. In-app message banners still work in Expo Go.',
    };
  }

  try {
    await ensureAndroidChannels();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return {
        ok: false,
        reason: 'denied',
        message: 'Notification permission is off. Enable it in your device settings.',
      };
    }

    const projectId = resolveProjectId();
    if (!projectId) {
      return {
        ok: false,
        reason: 'missing_project',
        message: 'Set EXPO_PUBLIC_EAS_PROJECT_ID in mobile/.env (run eas init on expo.dev).',
      };
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data;

    if (!token.startsWith('ExponentPushToken')) {
      return {
        ok: false,
        reason: 'error',
        message: 'Received an invalid push token from the device.',
      };
    }

    setLastRegisteredPushToken(token);
    return { ok: true, token };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const firebase = /firebase|FCM|FirebaseApp/i.test(message);

    return {
      ok: false,
      reason: firebase ? 'firebase' : 'error',
      message: firebase
        ? 'Android push needs Firebase (google-services.json). Use EAS Build or add FCM credentials.'
        : message || 'Push registration failed.',
    };
  }
}

export function getDeviceRegistrationMeta() {
  return {
    device_type: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
    device_name: Device.modelName ?? undefined,
    app_version: Constants.expoConfig?.version ?? undefined,
    os_version: Device.osVersion ? `${Platform.OS} ${Device.osVersion}` : Platform.OS,
  } as const;
}

export type PushNotificationData = {
  type?: string;
  click_action?: string;
  conversation_id?: string;
  thread_title?: string;
};

export function getConversationIdFromNotificationData(
  data: Record<string, unknown> | PushNotificationData | undefined,
): string | null {
  if (!data || typeof data.conversation_id !== 'string' || data.conversation_id.length === 0) {
    return null;
  }

  return data.conversation_id;
}

export async function unregisterPushNotificationsFromBackend() {
  const token = getLastRegisteredPushToken() ?? (await hydratePushTokenFromStorage());
  if (!token) {
    return;
  }

  try {
    await unregisterMobileDevice(token);
  } catch {
    // Best effort during logout.
  } finally {
    setLastRegisteredPushToken(null);
  }
}
