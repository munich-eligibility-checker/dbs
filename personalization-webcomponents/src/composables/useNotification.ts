import { ref } from "vue";

export type NotificationType = "success" | "info" | "warning" | "emergency";

/** Duration in milliseconds before notification auto-dismisses */
const NOTIFICATION_DISMISS_TIMEOUT_MS = 3000;

/**
 * Composable for managing notification/banner messages.
 * Provides a reactive message state and methods to show/dismiss notifications.
 */
export function useNotification() {
  const message = ref("");
  const messageType = ref<NotificationType>("success");

  /**
   * Display a notification message that auto-dismisses.
   * @param msg - The message to display
   * @param type - The type of notification (affects styling)
   */
  function showMessage(msg: string, type: NotificationType): void {
    message.value = msg;
    messageType.value = type;
    setTimeout(() => {
      message.value = "";
    }, NOTIFICATION_DISMISS_TIMEOUT_MS);
  }

  /**
   * Immediately dismiss the current notification.
   */
  function dismissMessage(): void {
    message.value = "";
  }

  return {
    message,
    messageType,
    showMessage,
    dismissMessage,
  };
}
