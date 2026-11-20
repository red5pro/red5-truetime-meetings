import { ReactNode, useCallback } from 'react';
import { useSnackbar, SnackbarKey, VariantType } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Alert } from 'truetime-ui';

interface NotificationOptions {
  persist?: boolean;
  duration?: number;
  vertical?: 'top' | 'bottom';
  horizontal?: 'left' | 'center' | 'right';
  action?: ReactNode;
}

interface CustomNotificationHook {
  displayMessage: (message: string, variant?: VariantType, options?: NotificationOptions) => void;
  showSuccess: (message: string, options?: NotificationOptions) => void;
  showError: (message: string, options?: NotificationOptions) => void;
  showWarning: (message: string, options?: NotificationOptions) => void;
  showInfo: (message: string, options?: NotificationOptions) => void;
  closeAllNotifications: () => void;
}

const severityOf = (variant: VariantType): 'success' | 'error' | 'warning' | 'info' =>
  variant === 'success' || variant === 'error' || variant === 'warning' ? variant : 'info';

/**
 * Toasts through notistack (which keeps the queue and timing), drawn as truetime-ui's floating
 * `Alert`: theme colours with readable text, an icon per severity, a labelled close button, and
 * `role="alert"` for errors and warnings (`status` otherwise) so screen readers announce them.
 */
export const useCustomNotification = (): CustomNotificationHook => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const displayMessage = useCallback(
    (message: string, variant: VariantType = 'info', options: NotificationOptions = {}): void => {
      // One message at a time, so a burst of events doesn't stack up
      closeSnackbar();
      const messageText = typeof message === 'string' ? message : String(message);

      enqueueSnackbar(messageText, {
        variant,
        persist: !!options.persist,
        autoHideDuration: options.persist ? null : options.duration || 2000,
        anchorOrigin: {
          vertical: options.vertical || 'top',
          horizontal: options.horizontal || 'right',
        },
        content: (key: SnackbarKey) => (
          <div id={`snackbar-${key}`} style={{ width: 'min(400px, calc(100vw - 32px))' }}>
            <Alert
              floating
              severity={severityOf(variant)}
              action={options.action}
              onClose={() => closeSnackbar(key)}
              closeText={t('Close')}
            >
              {messageText}
            </Alert>
          </div>
        ),
      });
    },
    [closeSnackbar, enqueueSnackbar, t],
  );

  const showSuccess = useCallback(
    (message: string, options?: NotificationOptions): void =>
      displayMessage(message, 'success', options),
    [displayMessage],
  );

  const showError = useCallback(
    (message: string, options?: NotificationOptions): void =>
      displayMessage(message, 'error', { duration: 8000, ...options }),
    [displayMessage],
  );

  const showWarning = useCallback(
    (message: string, options?: NotificationOptions): void =>
      displayMessage(message, 'warning', options),
    [displayMessage],
  );

  const showInfo = useCallback(
    (message: string, options?: NotificationOptions): void =>
      displayMessage(message, 'info', options),
    [displayMessage],
  );

  return {
    displayMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAllNotifications: closeSnackbar,
  };
};
