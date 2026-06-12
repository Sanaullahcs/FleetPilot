import { Platform, Vibration } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';

const MESSAGE_CHIME = require('../../assets/sounds/message-chime.wav');

export type MessageAlertPayload = {
  title: string;
  body: string;
  conversationId: string;
};

let chimePlayer: AudioPlayer | null = null;
let audioReady = false;
let audioInit: Promise<void> | null = null;

function vibrateAlert() {
  if (Platform.OS === 'web') return;
  Vibration.vibrate([0, 45, 55, 45]);
}

async function ensureMessageAudioReady() {
  if (audioReady) return;
  if (!audioInit) {
    audioInit = (async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      });
      if (!chimePlayer) {
        chimePlayer = createAudioPlayer(MESSAGE_CHIME);
        chimePlayer.volume = 0.9;
      }
      audioReady = true;
    })().catch(() => {
      audioInit = null;
    });
  }
  await audioInit;
}

/** In-app chime — works in Expo Go and foreground without push permission. */
export async function playInAppMessageChime() {
  try {
    await ensureMessageAudioReady();
    if (!chimePlayer) return;
    await chimePlayer.seekTo(0);
    chimePlayer.play();
  } catch {
    // ignore playback errors
  }
}

export async function playMessageReceivedInThread() {
  vibrateAlert();
  await playInAppMessageChime();
}

/** Vibration + in-app chime + optional system notification banner. */
export async function playMessageReceivedAlert(payload: MessageAlertPayload): Promise<boolean> {
  vibrateAlert();
  await playInAppMessageChime();

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'chat_message',
          click_action: 'open_chat',
          conversation_id: payload.conversationId,
        },
      },
      trigger: Platform.OS === 'android' ? { channelId: 'messages' } : null,
    });

    return true;
  } catch {
    return false;
  }
}

/** Call once when the app loads so the first message plays without delay. */
export function primeMessageAudio() {
  void ensureMessageAudioReady();
}
