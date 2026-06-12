import { useEffect, useRef } from 'react';
import { LogBox } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registerMobileDevice } from '@/lib/mobile-api';
import { ApiError } from '@/lib/api';
import {
  getConversationIdFromNotificationData,
  getDeviceRegistrationMeta,
  getLastRegisteredPushToken,
  hydratePushTokenFromStorage,
  isExpoGoApp,
  isPushSupportedOnDevice,
  registerForPushNotificationsAsync,
  setLastRegisteredPushToken,
} from '@/lib/push-notifications';
import { usePushStatusStore } from '@/store/push-status';

LogBox.ignoreLogs([
  'Push notifications',
  'expo-notifications',
  'ExponentPushToken',
  'FirebaseApp',
]);

function openChatFromResponse(
  router: ReturnType<typeof useRouter>,
  response: Notifications.NotificationResponse | null,
) {
  if (!response) {
    return;
  }

  const data = response.notification.request.content.data as Record<string, unknown>;
  const conversationId = getConversationIdFromNotificationData(data);

  if (conversationId) {
    router.push(`/chat/${conversationId}`);
  }
}

async function registerTokenWithBackend(token: string): Promise<string | null> {
  await registerMobileDevice({
    device_token: token,
    ...getDeviceRegistrationMeta(),
  });
  return null;
}

function backendErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'Could not reach the server to register this device.';
    }
    return error.message;
  }
  return 'Could not register this device for push alerts.';
}

export function usePushNotifications(enabled: boolean) {
  const router = useRouter();
  const registeredTokenRef = useRef<string | null>(getLastRegisteredPushToken());
  const setPushStatus = usePushStatusStore((s) => s.setStatus);
  const resetPushStatus = usePushStatusStore((s) => s.reset);

  useEffect(() => {
    if (!enabled) {
      resetPushStatus();
      return;
    }

    let cancelled = false;
    let tokenSubscription: Notifications.Subscription | null = null;

    (async () => {
      await hydratePushTokenFromStorage();
      registeredTokenRef.current = getLastRegisteredPushToken();

      if (!isPushSupportedOnDevice()) {
        setPushStatus('simulator', 'Push works on a physical device.');
        return;
      }

      if (isExpoGoApp()) {
        setPushStatus(
          'expo_go',
          'Use the FleetPilot APK for push alerts. Message banners still work here.',
        );
        return;
      }

      tokenSubscription = Notifications.addPushTokenListener(({ data: nextToken }) => {
        if (!nextToken || registeredTokenRef.current === nextToken || cancelled) {
          return;
        }

        registeredTokenRef.current = nextToken;
        setLastRegisteredPushToken(nextToken);
        void registerTokenWithBackend(nextToken)
          .then(() => {
            if (!cancelled) setPushStatus('registered');
          })
          .catch((error) => {
            if (!cancelled) {
              setPushStatus('unavailable', backendErrorMessage(error));
            }
          });
      });

      const result = await registerForPushNotificationsAsync();
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        if (result.reason === 'denied') {
          setPushStatus('denied', result.message);
        } else if (result.reason === 'expo_go') {
          setPushStatus('expo_go', result.message);
        } else {
          setPushStatus('unavailable', result.message);
        }
        return;
      }

      if (registeredTokenRef.current === result.token) {
        setPushStatus('registered');
        return;
      }

      try {
        const backendError = await registerTokenWithBackend(result.token);
        if (cancelled) return;
        if (backendError) {
          setPushStatus('unavailable', backendError);
          return;
        }
        registeredTokenRef.current = result.token;
        setPushStatus('registered');
      } catch (error) {
        if (!cancelled) {
          setPushStatus('unavailable', backendErrorMessage(error));
        }
      }
    })();

    return () => {
      cancelled = true;
      tokenSubscription?.remove();
    };
  }, [enabled, resetPushStatus, setPushStatus]);

  useEffect(() => {
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      openChatFromResponse(router, response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openChatFromResponse(router, response);
    });

    return () => subscription.remove();
  }, [router]);
}

/** Manual retry from Profile screen */
export async function retryPushRegistration(): Promise<{ ok: boolean; message: string }> {
  const result = await registerForPushNotificationsAsync();
  if (!result.ok) {
    usePushStatusStore.getState().setStatus(
      result.reason === 'denied' ? 'denied' : result.reason === 'expo_go' ? 'expo_go' : 'unavailable',
      result.message,
    );
    return { ok: false, message: result.message };
  }

  try {
    await registerMobileDevice({
      device_token: result.token,
      ...getDeviceRegistrationMeta(),
    });
    setLastRegisteredPushToken(result.token);
    usePushStatusStore.getState().setStatus('registered');
    return { ok: true, message: 'Push notifications are enabled on this device.' };
  } catch (error) {
    const message = backendErrorMessage(error);
    usePushStatusStore.getState().setStatus('unavailable', message);
    return { ok: false, message };
  }
}
