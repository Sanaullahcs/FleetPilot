import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { unregisterMobileDevice } from '@/lib/mobile-api';

let lastRegisteredPushToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as Record<string, unknown>;
    const isChat = data?.type === 'chat_message';

    return {
      shouldShowAlert: !isChat,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: !isChat,
      shouldShowList: !isChat,
    };
  },
});

export function getLastRegisteredPushToken() {
  return lastRegisteredPushToken;
}

export function setLastRegisteredPushToken(token: string | null) {
  lastRegisteredPushToken = token;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#4F5BA9',
      sound: 'default',
    });
  }

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
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  const token = tokenResponse.data;
  setLastRegisteredPushToken(token);

  return token;
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
  const token = getLastRegisteredPushToken();
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
