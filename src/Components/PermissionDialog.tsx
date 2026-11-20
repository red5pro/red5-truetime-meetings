import { useState, useEffect, useId, type ReactNode } from 'react';
import { Dialog, DialogContent, Box, Typography, useTheme } from '@mui/material';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Button, radii, Spinner, themeColors } from 'truetime-ui';
import { getDialogStyle } from '../styles/themeUtil.js';

interface InitialPermissionDialogProps {
  open: boolean;
  onRequestPermissions: () => void;
}

interface RequestingPermissionDialogProps {
  open: boolean;
}

interface PermissionDeniedDialogProps {
  open: boolean;
  onTryAgain: () => void;
}

interface PermissionGrantedDialogProps {
  open: boolean;
  onJoinMeeting: () => void;
}

interface PermissionFlowManagerProps {
  open: boolean;
  setIsPermissionDialogVisible?: (visible: boolean) => void;
  localVideoCreate: () => void;
  updateDevicesList: () => void;
  setCameraPermissionState: (state: string) => void;
  setMicrophonePermissionState: (state: string) => void;
}

type PermissionStep = 'initial' | 'requesting' | 'denied' | 'granted';

interface PermissionShellProps {
  open: boolean;
  /** Icon or spinner above the title. */
  visual?: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}

/** The layout every step shares: centred visual, title, description and an optional action. */
function PermissionShell({ open, visual, title, description, children }: PermissionShellProps) {
  const theme = useTheme();
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      PaperProps={{
        sx: {
          ...getDialogStyle(theme),
          [theme.breakpoints.down('sm')]: { px: 3 },
        },
      }}
    >
      <DialogContent sx={{ px: 0, py: 3, textAlign: 'center' }}>
        {visual && <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>{visual}</Box>}
        <Typography
          id={titleId}
          variant="h5"
          component="h2"
          sx={{ fontSize: { xs: 24, sm: 28 }, mb: 2, textWrap: 'balance' }}
        >
          {title}
        </Typography>
        <Typography
          id={descriptionId}
          sx={{ color: themeColors(theme).mutedText, lineHeight: 1.5, textWrap: 'pretty' }}
        >
          {description}
        </Typography>
        {children && <Box sx={{ mt: 4 }}>{children}</Box>}
      </DialogContent>
    </Dialog>
  );
}

export function InitialPermissionDialog({
  open,
  onRequestPermissions,
}: InitialPermissionDialogProps) {
  const { t } = useTranslation();

  return (
    <PermissionShell
      open={open}
      title={t('Join meeting with camera and microphone?')}
      description={t(
        'Your audio and video settings can be adjusted at any point during the meeting.',
      )}
    >
      <Button
        shape="pill"
        color="secondary"
        size="large"
        fullWidth
        id="give_device_permission_button"
        onClick={onRequestPermissions}
      >
        {t('Join with audio and video')}
      </Button>
    </PermissionShell>
  );
}

// Requesting Permission Dialog
export function RequestingPermissionDialog({ open }: RequestingPermissionDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <PermissionShell
      open={open}
      visual={<Spinner size={48} color={themeColors(theme).text} />}
      title={t('Requesting permissions...')}
      description={t(
        'Please allow access to your camera and microphone when prompted by your browser.',
      )}
    />
  );
}

// Permission Denied Dialog
export function PermissionDeniedDialog({ open }: PermissionDeniedDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = themeColors(theme);

  return (
    <PermissionShell
      open={open}
      visual={<ErrorOutline aria-hidden sx={{ fontSize: 64, color: colors.warning }} />}
      title={t('Camera and microphone access needed')}
      description={t('To join with audio and video, please allow access:')}
    >
      <Box
        sx={{
          p: 3,
          textAlign: 'left',
          borderRadius: `${radii.control}px`,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, mb: 1.5 }}>
          {t('Instructions:')}
        </Typography>
        <Box component="ol" sx={{ m: 0, pl: 2.5, color: colors.text, '& li + li': { mt: 1 } }}>
          <li>{t('Look for the camera/microphone icon in your address bar')}</li>
          <li>{t('Click on it and select "Allow"')}</li>
        </Box>
      </Box>
    </PermissionShell>
  );
}

// Permission Granted Dialog
export function PermissionGrantedDialog({ open, onJoinMeeting }: PermissionGrantedDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <PermissionShell
      open={open}
      visual={
        <CheckCircleOutline aria-hidden sx={{ fontSize: 56, color: themeColors(theme).success }} />
      }
      title={t("Perfect! You're all set")}
      description={t(
        'Camera and microphone access granted. You can now join the meeting with full audio and video.',
      )}
    >
      <Button shape="pill" size="large" fullWidth onClick={onJoinMeeting}>
        {t('Join meeting')}
      </Button>
    </PermissionShell>
  );
}

// Main Permission Flow Manager
export default function PermissionFlowManager({
  open,
  setIsPermissionDialogVisible,
  localVideoCreate,
  updateDevicesList,
  setCameraPermissionState,
  setMicrophonePermissionState,
}: PermissionFlowManagerProps) {
  const [currentStep, setCurrentStep] = useState<PermissionStep>('initial');

  const requestPermissions = async () => {
    setCurrentStep('requesting');

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      mediaStream.getTracks().forEach((track) => track.stop());
      setCurrentStep('granted');
    } catch (error) {
      console.error('Permission denied:', error);

      if (error instanceof Error && error.name === 'NotAllowedError') {
        setCurrentStep('denied');
      } else {
        setCurrentStep('denied');
      }
    }
  };

  const handleJoinMeeting = () => {
    if (setIsPermissionDialogVisible) {
      setIsPermissionDialogVisible(false);
      localVideoCreate();
      updateDevicesList();
      setCameraPermissionState('granted');
      setMicrophonePermissionState('granted');
    }
  };

  // Reset to initial state and check permissions whenever dialog opens
  useEffect(() => {
    if (open) {
      queueMicrotask(() => setCurrentStep('initial'));

      // Check current permission state
      const checkPermissions = async () => {
        try {
          const cameraPermission = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });
          const micPermission = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
          });

          // If both are already granted, auto-request to verify they still work
          if (cameraPermission.state === 'granted' && micPermission.state === 'granted') {
            requestPermissions();
          }
        } catch (error) {
          // Permissions API not supported, just show initial dialog
          console.log('Permissions API not available', error);
        }
      };

      checkPermissions();
    }
  }, [open]);

  return (
    <>
      <InitialPermissionDialog
        open={open && currentStep === 'initial'}
        onRequestPermissions={requestPermissions}
      />

      <RequestingPermissionDialog open={open && currentStep === 'requesting'} />

      <PermissionDeniedDialog
        open={open && currentStep === 'denied'}
        onTryAgain={requestPermissions}
      />

      <PermissionGrantedDialog
        open={open && currentStep === 'granted'}
        onJoinMeeting={handleJoinMeeting}
      />
    </>
  );
}
