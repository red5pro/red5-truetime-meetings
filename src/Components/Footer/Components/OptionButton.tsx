import React from 'react';
import { SvgIcon } from '../../SvgIcon.js';
import Menu from '@mui/material/Menu';
import { useTheme } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import SettingsDialog from './SettingsDialog.tsx';
import { LayoutSettingsDialog } from './LayoutSettingsDialog.tsx';
import { DiagnosticDialog } from './DiagnosticDialog.tsx';
import {
  ListItemIcon,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import GeneralSettingsDialog from './GeneralSettingsDialog.tsx';
import { ThemeList } from '../../../constants/themeList.js';
import { ThemeContext } from '../../../App.js';
import i18n from 'i18next';
import { CustomizedBtn, rectangularStyle } from '../../CustomizedBtn.tsx';
import { getGlassMenuStyle } from '../../../styles/themeUtil.js';
import { PictureInPicture, PictureInPictureAlt } from '@mui/icons-material';
import log from 'loglevel';
import { getRuntimeConfig } from '../../../utils/configStore';
import { isMobile } from 'react-device-detect';

interface Device {
  deviceId: string;
  label: string;
}

interface DeviceList {
  videoInputs?: Device[];
  audioInputs?: Device[];
  audioOutputs?: Device[];
}

interface Globals {
  desiredTileCount?: number;
}

interface NetworkScore {
  inbound: number;
  outbound: number;
  statsSamples: Record<string, any>;
}

interface ConnectionStatData {
  connectionType?: string;
  outboundVideo?: any;
  inboundVideo?: any;
  outboundAudio?: any;
  inboundAudio?: any;
  candidatePairs?: any[];
  quality?: any;
}

interface Issue {
  type: string;
  reason: string;
  statsSample: {
    description: string;
    severity: 'critical' | 'warning' | 'info';
    connectionId: string;
  };
}

interface PiPInfo {
  text: string;
  disabled: boolean;
  active?: boolean;
}

interface OptionButtonProps {
  footer?: boolean;
  glass?: boolean;
  isPlayOnly?: boolean;
  isRecordingActive?: boolean;
  effectsDrawerOpen?: boolean;
  devices?: DeviceList;
  selectedCamera?: string;
  selectedMicrophone?: string;
  selectedSpeaker?: string;
  selectedBackgroundMode?: string;
  outgoingBitrate?: string;
  globals?: Globals;
  layout?: string;
  networkScore?: NetworkScore;
  connectionStats?: Record<string, ConnectionStatData>;
  currentIssues?: Issue[];
  printStatLogs?: boolean;
  pushToTalkEnabled?: boolean;
  pipSupported?: boolean;
  pipIsOpen?: boolean;
  handleBackgroundReplacement?: (mode: string) => void;
  microphoneSelected?: (deviceId: string) => void;
  cameraSelected?: (deviceId: string) => void;
  speakerSelected?: (deviceId: string) => void;
  setSelectedBackgroundMode?: (mode: string) => void;
  updateOutgoingBitrate?: (bitrate: string) => void;
  handleSetDesiredTileCount?: (count: number) => void;
  changeLayout?: (layout: string) => void;
  setPrintStatLogs?: (printStatLogs: boolean) => void;
  onPushToTalkToggle?: (enabled: boolean) => void;
  openAllParticipantsPiP?: () => void;
  closePiP?: () => void;
  startRecord?: (
    recordSeparately?: boolean,
    serverRecording?: boolean,
    localRecording?: boolean,
  ) => void;
  stopRecord?: (serverRecording?: boolean, localRecording?: boolean) => void;
  isLocalRecordingActive?: boolean;
  startLocalRecording?: () => void;
  stopLocalRecording?: () => void;
  downloadLocalRecording?: (filename?: string) => Promise<boolean>;
  handleEffectsOpen?: (open: boolean) => void;
  updateDevicesList: () => void;
  transcriptionDrawerOpen?: boolean;
  handleTranscriptionDrawerOpen?: (open: boolean) => void;
}

function OptionButton(props: OptionButtonProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [layoutDialogOpen, setLayoutDialogOpen] = React.useState<boolean>(false);
  const [diagnosticDialogOpen, setDiagnosticDialogOpen] = React.useState<boolean>(false);
  const [generalSettingsDialogOpen, setGeneralSettingsDialogOpen] = React.useState<boolean>(false);
  const [recordingModalOpen, setRecordingModalOpen] = React.useState<boolean>(false);
  const [recordSeparately, setRecordSeparately] = React.useState<boolean>(() => {
    return localStorage.getItem('recordSeparately') === 'true';
  });
  const [localRecordingChecked, setLocalRecordingChecked] = React.useState<boolean>(() => {
    return localStorage.getItem('localRecordingChecked') === 'true';
  });
  const [serverSideRecordingChecked, setServerSideRecordingChecked] = React.useState<boolean>(
    () => {
      return localStorage.getItem('serverSideRecordingChecked') === 'true';
    },
  );

  React.useEffect(() => {
    localStorage.setItem('recordSeparately', String(recordSeparately));
  }, [recordSeparately]);

  React.useEffect(() => {
    localStorage.setItem('localRecordingChecked', String(localRecordingChecked));
  }, [localRecordingChecked]);

  React.useEffect(() => {
    localStorage.setItem('serverSideRecordingChecked', String(serverSideRecordingChecked));
  }, [serverSideRecordingChecked]);
  const [_hovered, setHovered] = React.useState<boolean>(false);
  const theme = useTheme();
  const themeContext = React.useContext(ThemeContext);

  const isRecordingEnabled = getRuntimeConfig().VITE_ENABLE_RECORDING === 'true';
  const isCaptionEnabled = getRuntimeConfig().VITE_ENABLE_CLOSED_CAPTION === 'true';

  // Language and theme states
  const [currentLanguage, setCurrentLanguage] = React.useState<string>(
    localStorage.getItem('i18nextLng') || 'en',
  );
  const [currentTheme, setCurrentTheme] = React.useState<string>(
    themeContext?.currentTheme || ThemeList.Black,
  );

  // Language handler
  const switchLanguage = (value: string): void => {
    localStorage.setItem('i18nextLng', value);
    i18n.changeLanguage(value).then(() => {
      setCurrentLanguage(value);
      log.log('Language switched to', value);
    });
  };

  // Theme handler
  const switchTheme = (value: string): void => {
    localStorage.setItem('selectedTheme', value);
    themeContext?.setCurrentTheme(value);
    setCurrentTheme(value);
  };

  // if you select camera then we are going to focus on camera button.
  const [selectFocus, setSelectFocus] = React.useState<string | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleDialogOpen = (focus?: string): void => {
    setSelectFocus(focus || null);
    setDialogOpen(true);
    handleClose();
  };

  const handleDialogClose = (_value?: any): void => {
    setDialogOpen(false);
  };

  const handleDiagnosticDialogOpen = (focus?: string): void => {
    setSelectFocus(focus || null);
    setDiagnosticDialogOpen(true);
    handleClose();
  };

  const handleDiagnosticDialogClose = (_value?: any): void => {
    setDiagnosticDialogOpen(false);
  };

  const handleLayoutDialogOpen = (focus?: string): void => {
    setSelectFocus(focus || null);
    setLayoutDialogOpen(true);
    handleClose();
  };

  const handleLayoutDialogClose = (_value?: any): void => {
    setLayoutDialogOpen(false);
  };

  const handleGeneralSettingsDialogClose = (_value?: any): void => {
    setGeneralSettingsDialogOpen(false);
  };

  // PiP handler
  const handlePiPClick = (): void => {
    if (!props?.pipSupported) {
      console.warn(
        'Picture-in-Picture is not supported in this browser. Please use Chrome 111+ or Edge 111+',
      );
      return;
    }

    if (props?.pipIsOpen) {
      props?.closePiP?.();
    } else {
      props?.openAllParticipantsPiP?.();
    }
    handleClose();
  };

  // Get PiP display info
  const getPiPInfo = (): PiPInfo => {
    if (!props?.pipSupported) {
      return { text: 'Picture-in-Picture (Not Supported)', disabled: true };
    }

    if (props?.pipIsOpen) {
      return {
        text: `Close Picture-in-Picture`,
        disabled: false,
        active: true,
      };
    }

    return {
      text: `Picture-in-Picture`,
      disabled: false,
    };
  };

  // Determine icon color based on button state
  const getMainIconColor = (): string => {
    return theme.palette.themeColor[99]; // Pure white for both states
  };

  // Get menu icon color
  const getMenuIconColor = (): string => {
    return theme.palette.themeColor[99]; // Pure white for menu icons
  };

  const handleStartRecording = (): void => {
    setRecordingModalOpen(true);
    handleClose();
  };

  const handleRecordingModalClose = (): void => {
    setRecordingModalOpen(false);
  };

  const handleRecordingConfirm = (): void => {
    // Recording each participant separately is itself a server-side capability,
    // so it must enable server recording even if "Cloud recording" wasn't checked.
    props?.startRecord?.(
      recordSeparately,
      serverSideRecordingChecked || recordSeparately,
      localRecordingChecked,
    );
    if (localRecordingChecked && props.startLocalRecording) {
      props.startLocalRecording();
    }
    setRecordingModalOpen(false);
  };

  const handleStopRecording = (): void => {
    props?.stopRecord?.(props.isRecordingActive, props.isLocalRecordingActive);
    if (props.isLocalRecordingActive && props.stopLocalRecording) {
      props.stopLocalRecording();
    }
    handleClose();
  };

  const handleFullScreenToggle = (): void => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then((r) => log.log('Fullscreen is requested', r));
    } else {
      document.exitFullscreen().then((r) => log.log('Fullscreen is exited', r));
    }
    handleClose();
  };

  const handleVirtualEffects = (): void => {
    props?.handleEffectsOpen?.(!props?.effectsDrawerOpen);
    handleClose();
  };

  const handleTranscriptionToggle = (): void => {
    props?.handleTranscriptionDrawerOpen?.(!props?.transcriptionDrawerOpen);
    handleClose();
  };

  const pipInfo = getPiPInfo();

  return (
    <>
      <SettingsDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        //@ts-ignore
        selectFocus={selectFocus}
        devices={props?.devices}
        selectedCamera={props?.selectedCamera}
        cameraSelected={props?.cameraSelected}
        selectedMicrophone={props?.selectedMicrophone}
        selectedSpeaker={props?.selectedSpeaker}
        speakerSelected={props?.speakerSelected}
        selectedBackgroundMode={props?.selectedBackgroundMode}
        setSelectedBackgroundMode={props?.setSelectedBackgroundMode}
        outgoingBitrate={props?.outgoingBitrate}
        updateOutgoingBitrate={props?.updateOutgoingBitrate}
        pushToTalkEnabled={props?.pushToTalkEnabled}
        onPushToTalkToggle={props?.onPushToTalkToggle}
        microphoneSelected={props?.microphoneSelected}
      />
      <LayoutSettingsDialog
        open={layoutDialogOpen}
        onClose={handleLayoutDialogClose}
        //@ts-ignore
        globals={props?.globals}
        handleSetDesiredTileCount={props?.handleSetDesiredTileCount}
        layout={props?.layout}
        changeLayout={props?.changeLayout}
      />
      <DiagnosticDialog
        open={diagnosticDialogOpen}
        onClose={handleDiagnosticDialogClose}
        selectFocus={selectFocus}
        networkScore={props?.networkScore}
        connectionStats={props?.connectionStats}
        currentIssues={props?.currentIssues}
        printStatLogs={props?.printStatLogs || false}
        setPrintStatLogs={props?.setPrintStatLogs || (() => {})}
      />
      <GeneralSettingsDialog
        open={generalSettingsDialogOpen}
        onClose={handleGeneralSettingsDialogClose}
        currentLanguage={currentLanguage}
        switchLanguage={switchLanguage}
        currentTheme={currentTheme}
        switchTheme={switchTheme}
      />
      <Dialog
        open={recordingModalOpen}
        onClose={handleRecordingModalClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 420,
          },
        }}
      >
        <DialogTitle>{t('Recording Options')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t(
              'Pick where this meeting is captured. Cloud and on-device are separate recordings — select either or both.',
            )}
          </Typography>
          <Box
            sx={{
              border: '1px solid',
              borderColor: serverSideRecordingChecked ? 'error.main' : 'divider',
              borderRadius: 2,
              p: 1,
              mb: 1.5,
            }}
          >
            <FormControlLabel
              sx={{ alignItems: 'flex-start', width: '100%', m: 0 }}
              control={
                <Checkbox
                  checked={serverSideRecordingChecked}
                  onChange={(e) => setServerSideRecordingChecked(e.target.checked)}
                />
              }
              label={
                <Box sx={{ pt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={600}>{t('Cloud recording')}</Typography>
                    <Chip label={t('SERVER-SIDE')} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      'Recorded and stored on Red5 Cloud. Best for sharing, long sessions, and high quality regardless of your connection.',
                    )}
                  </Typography>
                </Box>
              }
            />
          </Box>
          <Box
            sx={{
              border: '1px solid',
              borderColor: recordSeparately ? 'error.main' : 'divider',
              borderRadius: 2,
              p: 1,
              mb: 1.5,
            }}
          >
            <FormControlLabel
              sx={{ alignItems: 'flex-start', width: '100%', m: 0 }}
              control={
                <Checkbox
                  checked={recordSeparately}
                  onChange={(e) => setRecordSeparately(e.target.checked)}
                />
              }
              label={
                <Box sx={{ pt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={600}>{t('Record participants separately')}</Typography>
                    <Chip label={t('SERVER-SIDE')} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      "Save each participant's audio and video as its own file, stored on Red5 Cloud. Works on its own — you don't need to also enable Cloud recording.",
                    )}
                  </Typography>
                </Box>
              }
            />
          </Box>
          <Box
            sx={{
              border: '1px solid',
              borderColor: localRecordingChecked ? 'error.main' : 'divider',
              borderRadius: 2,
              p: 1,
            }}
          >
            <FormControlLabel
              sx={{ alignItems: 'flex-start', width: '100%', m: 0 }}
              control={
                <Checkbox
                  checked={localRecordingChecked}
                  onChange={(e) => setLocalRecordingChecked(e.target.checked)}
                />
              }
              label={
                <Box sx={{ pt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={600}>{t('Local recording')}</Typography>
                    <Chip label={t('ON DEVICE')} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      'Saved straight to this device as a single file. Captures the meeting exactly as you see it.',
                    )}
                  </Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRecordingModalClose}>{t('Cancel')}</Button>
          <Button
            onClick={handleRecordingConfirm}
            variant="contained"
            disabled={!serverSideRecordingChecked && !recordSeparately && !localRecordingChecked}
          >
            {t('Start Recording')}
          </Button>
        </DialogActions>
      </Dialog>

      <Tooltip title={t('Options')} placement="top">
        <CustomizedBtn
          className={props?.footer ? 'footer-icon-button' : ''}
          id="settings-button"
          variant="contained"
          glass={props?.glass}
          sx={rectangularStyle}
          color={open ? 'primary' : 'secondary'}
          aria-controls={open ? 'demo-positioned-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={handleClick}
        >
          <SvgIcon size={24} viewBox="0 0 500 500" name={'settings'} color={getMainIconColor()} />
        </CustomizedBtn>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{ sx: getGlassMenuStyle(theme, 'secondary', true) }}
      >
        {/*
        <MenuItem key="general-settings" onClick={() => handleGeneralSettingsDialogOpen()}>
          <ListItemIcon>
            <SvgIcon size={24} viewBox="0 0 500 500" name={'settings'} color={getMenuIconColor()} />
          </ListItemIcon>
          <ListItemText
            id="general-button"
          >
            {t("General")}
          </ListItemText>
        </MenuItem>
        */}

        <MenuItem key="layout" onClick={() => handleLayoutDialogOpen()} id="change-layout-button">
          <ListItemIcon>
            <SvgIcon
              size={24}
              viewBox="0 0 500 500"
              name={'change-layout'}
              color={getMenuIconColor()}
            />
          </ListItemIcon>
          <ListItemText>{t('Change Layout')}</ListItemText>
        </MenuItem>

        {props?.isPlayOnly === false && (
          <MenuItem
            key="call-settings"
            onClick={() => {
              props?.updateDevicesList();
              handleDialogOpen();
            }}
            id="call-settings"
          >
            <ListItemIcon>
              <SvgIcon
                size={24}
                viewBox="0 0 500 500"
                name={'call-settings'}
                color={getMenuIconColor()}
              />
            </ListItemIcon>
            <ListItemText>{t('Call Settings')}</ListItemText>
          </MenuItem>
        )}

        {/* Picture-in-Picture Menu Item */}
        {!isMobile && (
          <MenuItem
            key="picture-in-picture"
            onClick={handlePiPClick}
            disabled={pipInfo.disabled}
            id="picture-in-picture-button"
            sx={{
              backgroundColor: pipInfo.active ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
              '&:hover': {
                backgroundColor: pipInfo.active ? 'rgba(25, 118, 210, 0.2)' : undefined,
              },
            }}
          >
            <ListItemIcon>
              {props?.pipSupported ? (
                <PictureInPicture
                  sx={{
                    color: getMenuIconColor(),
                    opacity: pipInfo.disabled ? 0.5 : 1,
                  }}
                />
              ) : (
                <PictureInPictureAlt
                  sx={{
                    color: getMenuIconColor(),
                    opacity: 0.5,
                  }}
                />
              )}
            </ListItemIcon>
            <ListItemText
              primary={pipInfo.text}
              sx={{
                '& .MuiListItemText-primary': {
                  color: pipInfo.disabled ? 'text.disabled' : 'text.primary',
                  fontWeight: pipInfo.active ? 500 : 400,
                },
              }}
            />
          </MenuItem>
        )}

        {props?.isRecordingActive === false && props?.isLocalRecordingActive === false && (
          <MenuItem
            key="start-recording"
            onClick={isRecordingEnabled ? handleStartRecording : undefined}
            disabled={!isRecordingEnabled}
            id="start-recording-button"
          >
            <ListItemIcon>
              <SvgIcon
                size={24}
                viewBox="0 0 500 500"
                name={'camera'}
                color={getMenuIconColor()}
                // @ts-ignore
                style={{ opacity: !isRecordingEnabled ? 0.5 : 1 }}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                !isRecordingEnabled
                  ? t('Upgrade your plan to support recording')
                  : t('Start Record')
              }
              sx={{
                '& .MuiListItemText-primary': {
                  color: !isRecordingEnabled ? 'text.disabled' : 'text.primary',
                },
              }}
            />
          </MenuItem>
        )}

        {(props?.isRecordingActive === true || props?.isLocalRecordingActive === true) && (
          <MenuItem
            key="stop-recording"
            onClick={isRecordingEnabled ? handleStopRecording : undefined}
            disabled={!isRecordingEnabled}
            id="stop-recording-button"
          >
            <ListItemIcon>
              <SvgIcon
                size={24}
                viewBox="0 0 500 500"
                name={'camera'}
                color={getMenuIconColor()}
                // @ts-ignore
                style={{ opacity: !isRecordingEnabled ? 0.5 : 1 }}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                !isRecordingEnabled ? t('Upgrade your plan to support recording') : t('Stop Record')
              }
              sx={{
                '& .MuiListItemText-primary': {
                  color: !isRecordingEnabled ? 'text.disabled' : 'text.primary',
                },
              }}
            />
          </MenuItem>
        )}

        <MenuItem key="full-screen" onClick={handleFullScreenToggle} id="full-screen">
          <ListItemIcon>
            <SvgIcon
              size={24}
              viewBox="0 0 500 500"
              name={document.fullscreenElement ? 'exit-full-screen' : 'full-screen'}
              color={getMenuIconColor()}
            />
          </ListItemIcon>
          <ListItemText>
            {document.fullscreenElement ? t('Exit full screen') : t('Full screen')}
          </ListItemText>
        </MenuItem>

        {props?.isPlayOnly === false && !isMobile && (
          <MenuItem key="virtual-effects" onClick={handleVirtualEffects} id="virtual-effects">
            <ListItemIcon>
              <SvgIcon
                size={24}
                viewBox="0 0 500 500"
                name={'virtual-effects'}
                color={getMenuIconColor()}
              />
            </ListItemIcon>
            <ListItemText>{t('Virtual Effects')}</ListItemText>
          </MenuItem>
        )}

        <MenuItem key="diagnostic" onClick={() => handleDiagnosticDialogOpen()} id="diagnostic">
          <ListItemIcon>
            <SvgIcon
              size={24}
              viewBox="0 0 500 500"
              name={'diagnostic'}
              color={getMenuIconColor()}
            />
          </ListItemIcon>
          <ListItemText>{t('Diagnostic')}</ListItemText>
        </MenuItem>

        <MenuItem
          key="transcription"
          onClick={isCaptionEnabled ? handleTranscriptionToggle : undefined}
          disabled={!isCaptionEnabled}
          id="transcription"
        >
          <ListItemIcon>
            <SvgIcon
              size={24}
              viewBox="0 0 500 500"
              name={'call-settings'}
              color={getMenuIconColor()}
              // @ts-ignore
              style={{ opacity: !isCaptionEnabled ? 0.5 : 1 }}
            />
          </ListItemIcon>
          <ListItemText
            primary={
              !isCaptionEnabled
                ? t('Upgrade your plan to support closed captioning')
                : t('Transcriptions')
            }
            sx={{
              '& .MuiListItemText-primary': {
                color: !isCaptionEnabled ? 'text.disabled' : 'text.primary',
              },
            }}
          />
        </MenuItem>

        <MenuItem
          key="report-problem"
          component={'a'}
          href={'https://customer.support.red5.net/servicedesk/customer/portal/3/group/8/create/39'}
          target={'_blank'}
          rel="noopener noreferrer"
        >
          <ListItemIcon>
            <SvgIcon size={24} viewBox="0 0 500 500" name={'report'} color={getMenuIconColor()} />
          </ListItemIcon>
          <ListItemText>{t('Report Problem')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default OptionButton;
