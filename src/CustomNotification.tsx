import { JSX, ReactNode, useCallback, useRef } from 'react';
import { useSnackbar, SnackbarKey, VariantType } from 'notistack';
import { SvgIcon } from '@mui/material';
import { useTheme, Theme } from '@mui/material/styles';

// Types
interface IconConfig {
  name: string;
  color: string;
  ariaLabel: string;
}

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

// Icon mapping for different notification types
const getNotificationIcon = (variant: VariantType, theme: Theme): JSX.Element => {
  const iconMap: Record<string, IconConfig> = {
    success: {
      name: 'check-circle',
      color: theme.palette.success.main,
      ariaLabel: 'Success',
    },
    error: {
      name: 'error-circle',
      color: theme.palette.error.main,
      ariaLabel: 'Error',
    },
    warning: {
      name: 'warning-triangle',
      color: theme.palette.warning.main,
      ariaLabel: 'Warning',
    },
    info: {
      name: 'info-circle',
      color: theme.palette.info.main,
      ariaLabel: 'Information',
    },
    default: {
      name: 'report',
      color: theme.palette.primary.main,
      ariaLabel: 'Notification',
    },
  };

  const iconConfig = iconMap[variant] || iconMap.default;

  return (
    <SvgIcon
      sx={{ fontSize: 24 }}
      viewBox="0 0 500 500"
      color={iconConfig.color as any}
      aria-label={iconConfig.ariaLabel}
      role="img"
    />
  );
};

// Enhanced notification hook
export const useCustomNotification = (): CustomNotificationHook => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const theme = useTheme();

  // Deduplication: suppress identical message+variant shown within 800 ms
  const lastNotifRef = useRef<{ message: string; variant: string; at: number } | null>(null);

  const displayMessage = useCallback(
    (message: string, variant: VariantType = 'info', options: NotificationOptions = {}): void => {
      // Deduplicate: ignore the same message+variant fired twice within 800 ms
      const now = Date.now();
      const last = lastNotifRef.current;
      if (last && last.message === message && last.variant === variant && now - last.at < 800) {
        return;
      }
      lastNotifRef.current = { message, variant, at: now };

      // Close existing notifications to avoid spam
      closeSnackbar();

      // Ensure message is a string for screen readers
      const messageText = typeof message === 'string' ? message : String(message);

      // Create accessible message with variant context
      const variantText = variant.charAt(0).toUpperCase() + variant.slice(1);
      const accessibleMessage = `${variantText}: ${messageText}`;

      enqueueSnackbar(messageText, {
        // Visual icon
        icon: getNotificationIcon(variant, theme),
        variant: variant,
        autoHideDuration: options.persist ? null : options.duration || 2000,

        // Positioning
        anchorOrigin: {
          vertical: options.vertical || 'top',
          horizontal: options.horizontal || 'right',
        },

        persist: !!options.persist,

        // Accessibility improvements
        action: options.action,

        // Additional props for accessibility
        SnackbarProps: {
          onMouseEnter: () => {}, // keep timer running
          onMouseLeave: () => {},
          // ARIA attributes for screen readers
          'aria-live': variant === 'error' ? ('assertive' as const) : ('polite' as const),
          'aria-atomic': 'true' as const,
          'aria-label': accessibleMessage,
          role: 'alert' as const,

          // Additional styling for visual distinction with your dark theme
          //@ts-ignore
          sx: {
            '& .SnackbarContent-root': {
              backgroundColor: getVariantColor(variant, theme),
              color: '#FFFFFF',
              fontFamily: 'ClashDisplay, sans-serif !important',
              fontWeight: 500,
              fontSize: '14px',
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.3)',
              border: `2px solid ${getBorderColor(variant, theme)}`,
              borderRadius: '6px',
              minHeight: '48px',

              // Override notistack default styles
              '&.notistack-MuiContent-root': {
                backgroundColor: `${getVariantColor(variant, theme)} !important`,
                color: '#FFFFFF !important',
                fontFamily: 'ClashDisplay, sans-serif !important',
              },

              // Ensure proper spacing and layout
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            },

            // Style the close button if present
            '& .SnackbarContent-action': {
              color: '#FFFFFF',
              marginLeft: 'auto',
              paddingLeft: '12px',
            },
          },
        },

        // Content wrapper for better screen reader support and dark theme compatibility
        content: (key: SnackbarKey, message: React.ReactNode) => (
          <div
            id={`snackbar-${key}`}
            role="alert"
            aria-live={variant === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 0',
              fontFamily: 'ClashDisplay, sans-serif',
              color: '#FFFFFF',
              backgroundColor: getVariantColor(variant, theme),
              borderRadius: '6px',
              border: `2px solid ${getBorderColor(variant, theme)}`,
              minHeight: '48px',
              width: '100%',
            }}
          >
            {getNotificationIcon(variant, theme)}
            <span
              style={{
                flex: 1,
                lineHeight: 1.4,
                fontSize: '14px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
              aria-describedby={`snackbar-${key}-description`}
            >
              {messageText}
            </span>
            {/* Hidden text for screen readers to announce notification type */}
            <span
              id={`snackbar-${key}-description`}
              className="sr-only"
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              {variantText} notification
            </span>
            <button
              onClick={() => closeSnackbar(key)}
              style={{
                background: 'transparent',
                color: '#FFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
              }}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        ),

        ...options,
      });
    },
    [closeSnackbar, enqueueSnackbar, theme],
  );

  // Convenience methods for different notification types
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

// Helper functions for styling
const getVariantColor = (variant: VariantType, theme: Theme): string => {
  const colorMap: Record<string, string> = {
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: '#262626',
    default: theme.palette.primary.main,
  };
  return colorMap[variant] || colorMap.default;
};

const getContrastColor = (variant: VariantType, theme: Theme): string => {
  const colorMap: Record<string, string> = {
    success: theme.palette.success.contrastText,
    error: theme.palette.error.contrastText,
    warning: theme.palette.warning.contrastText,
    info: theme.palette.info.contrastText,
    default: theme.palette.primary.contrastText,
  };
  return colorMap[variant] || colorMap.default;
};

const getBorderColor = (variant: VariantType, theme: Theme): string => {
  const colorMap: Record<string, string> = {
    success: theme.palette.success.dark,
    error: theme.palette.error.dark,
    warning: theme.palette.warning.dark,
    info: '#9E9E9E',
    default: theme.palette.primary.dark,
  };
  return colorMap[variant] || colorMap.default;
};
