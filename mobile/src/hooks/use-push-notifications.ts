import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registerMobileDevice } from '@/lib/mobile-api';
import {
  getConversationIdFromNotificationData,
  getDeviceRegistrationMeta,
  getLastRegisteredPushToken,
  registerForPushNotificationsAsync,
  setLastRegisteredPushToken,
} from '@/lib/push-notifications';

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

export function usePushNotifications(enabled: boolean) {
  const router = useRouter();
  const registeredTokenRef = useRef<string | null>(getLastRegisteredPushToken());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const tokenSubscription = Notifications.addPushTokenListener(({ data }) => {
      if (!data || registeredTokenRef.current === data) {
        return;
      }

      registeredTokenRef.current = data;
      setLastRegisteredPushToken(data);
      void registerMobileDevice({
        device_token: data,
        ...getDeviceRegistrationMeta(),
      }).catch(() => {});
    });

    let cancelled = false;

    (async () => {
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (cancelled || !pushToken || registeredTokenRef.current === pushToken) {
          return;
        }

        await registerMobileDevice({
          device_token: pushToken,
          ...getDeviceRegistrationMeta(),
        });

        registeredTokenRef.current = pushToken;
      } catch (error) {
        console.warn('Push registration failed:', error);
      }
    })();

    return () => {
      cancelled = true;
      tokenSubscription.remove();
    };
  }, [enabled]);

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
