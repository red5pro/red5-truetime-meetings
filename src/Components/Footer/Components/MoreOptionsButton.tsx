import React from 'react';
import { SvgIcon } from '../../SvgIcon.js';
import Menu from '@mui/material/Menu';
import { useTheme } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import SettingsDialog from './SettingsDialog.tsx';
import { LayoutSettingsDialog } from './LayoutSettingsDialog.tsx';
import { ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import GeneralSettingsDialog from './GeneralSettingsDialog.tsx';
import { isMobile, isTablet } from 'react-device-detect';
import i18n from 'i18next';
import { ThemeList } from '../../../constants/themeList.js';
import { ThemeContext } from '../../../App.js';
import { CustomizedBtn, rectangularStyle } from '../../CustomizedBtn.tsx';
import log from 'loglevel';
import { ClosedCaption, ClosedCaptionDisabled } from '@mui/icons-material';
import { Devices } from '../../DeviceSelector.tsx';
import { getRuntimeConfig } from '../../../utils/configStore';

interface Globals {
  desiredTileCount?: number;
}

interface MoreOptionsButtonProps {
  footer?: boolean;
  glass?: boolean;
  isPlayOnly?: boolean;
  isScreenShared?: boolean;
  showEmojis?: boolean;
  messageDrawerOpen?: boolean;
  participantListDrawerOpen?: boolean;
  devices?: Devices;
  selectedCamera?: string;
  selectedMicrophone?: string;
  selectedSpeaker?: string;
  selectedBackgroundMode?: string;
  outgoingBitrate?: string;
  globals?: Globals;
  layout?: string;
  pushToTalkEnabled?: boolean;
  handleBackgroundReplacement?: (mode: string) => void;
  microphoneSelected?: (deviceId: string) => void;
  cameraSelected?: (deviceId: string) => void;
  speakerSelected?: (deviceId: string) => void;
  setSelectedBackgroundMode?: (mode: string) => void;
  updateOutgoingBitrate?: (bitrate: string) => void;
  handleSetDesiredTileCount?: (count: number) => void;
  changeLayout?: (layout: string) => void;
  handleStopScreenShare?: () => void;
  handleStartScreenShare?: () => void;
  setShowEmojis?: (show: boolean) => void;
  toggleSetNumberOfUnreadMessages?: (count: number) => void;
  handleMessageDrawerOpen?: (open: boolean) => void;
  handleParticipantListOpen?: (open: boolean) => void;
  onPushToTalkToggle?: (enabled: boolean) => void;
  captionsVisible?: boolean;
  onToggleCaptions?: () => void;
  isRaiseHand?: boolean;
  setIsRaiseHand?: (open: boolean) => void;
  infoDrawerOpen?: boolean;
  handleInfoDrawerOpen?: (open: boolean) => void;
  transcriptionDrawerOpen?: boolean;
  handleTranscriptionDrawerOpen?: (open: boolean) => void;
  externalStreamsDrawerOpen?: boolean;
  handleExternalStreamsDrawerOpen?: (open: boolean) => void;
  hideExternalStreams?: boolean;
}

function MoreOptionsButton(props: MoreOptionsButtonProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [layoutDialogOpen, setLayoutDialogOpen] = React.useState<boolean>(false);
  const [generalSettingsDialogOpen, setGeneralSettingsDialogOpen] = React.useState<boolean>(false);
  const theme = useTheme();
  const themeContext = React.useContext(ThemeContext);

  // Check if closed caption feature is enabled
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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleDialogClose = (_value?: any): void => {
    setDialogOpen(false);
  };

  const handleLayoutDialogClose = (_value?: any): void => {
    setLayoutDialogOpen(false);
  };

  const handleGeneralSettingsDialogClose = (_value?: any): void => {
    setGeneralSettingsDialogOpen(false);
  };

  // Determine icon color based on button state
  const getMainIconColor = (): string => {
    return theme.palette.themeColor[99]; // Pure white for both states
  };

  // Get menu icon color
  const getMenuIconColor = (): string => {
    return theme.palette.themeColor[99]; // Pure white for menu icons
  };

  const handleCaptionsClick = (): void => {
    props?.onToggleCaptions?.();
    handleClose();
  };

  const handleScreenShareClick = (): void => {
    if (props?.isScreenShared) {
      props?.handleStopScreenShare?.();
    } else {
      props?.handleStartScreenShare?.();
    }
    handleClose();
  };

  const handleReactionsClick = (): void => {
    props?.setShowEmojis?.(!props?.showEmojis);
    handleClose();
  };

  const handleRaiseHandClick = (): void => {
    props?.setIsRaiseHand?.(!props?.isRaiseHand);
    handleClose();
  };

  const handleChatClick = (): void => {
    if (!props?.messageDrawerOpen) {
      props?.toggleSetNumberOfUnreadMessages?.(0);
    }
    props?.handleMessageDrawerOpen?.(!props?.messageDrawerOpen);
    handleClose();
  };

  const handleParticipantListClick = (): void => {
    props?.handleParticipantListOpen?.(!props?.participantListDrawerOpen);
    handleClose();
  };

  const handleMeetingDetailsClick = (): void => {
    props?.handleInfoDrawerOpen?.(!props?.infoDrawerOpen);
    handleClose();
  };

  const handleTranscriptionToggle = (): void => {
    props?.handleTranscriptionDrawerOpen?.(!props?.transcriptionDrawerOpen);
    handleClose();
  };

  const handleExternalStreamsToggle = (): void => {
    props?.handleExternalStreamsDrawerOpen?.(!props?.externalStreamsDrawerOpen);
    handleClose();
  };

  return (
    <>
      <SettingsDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        devices={props?.devices}
        selectedCamera={props?.selectedCamera}
        selectedSpeaker={props?.selectedSpeaker}
        selectedMicrophone={props?.selectedMicrophone}
        selectedBackgroundMode={props?.selectedBackgroundMode}
        outgoingBitrate={props?.outgoingBitrate}
        pushToTalkEnabled={props?.pushToTalkEnabled}
        cameraSelected={props?.cameraSelected}
        microphoneSelected={props?.microphoneSelected}
        speakerSelected={props?.speakerSelected}
        setSelectedBackgroundMode={props?.setSelectedBackgroundMode}
        updateOutgoingBitrate={props?.updateOutgoingBitrate}
        onPushToTalkToggle={props?.onPushToTalkToggle}
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
      <GeneralSettingsDialog
        open={generalSettingsDialogOpen}
        onClose={handleGeneralSettingsDialogClose}
        currentLanguage={currentLanguage}
        switchLanguage={switchLanguage}
        currentTheme={currentTheme}
        switchTheme={switchTheme}
      />
      <Tooltip title={t('More options')} placement="top">
        <CustomizedBtn
          className={props?.footer ? 'footer-icon-button' : ''}
          id="more-button"
          glass={props?.glass}
          sx={rectangularStyle}
          variant="contained"
          color={open ? 'primary' : 'secondary'}
          aria-controls={open ? 'demo-positioned-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          <SvgIcon size={24} viewBox="0 0 500 500" name={'option'} color={getMainIconColor()} />
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
      >
        <MenuItem disabled={!isCaptionEnabled} onClick={handleCaptionsClick}>
          <ListItemIcon>
            {props?.captionsVisible ? (
              <ClosedCaption sx={{ color: '#fff' }} />
            ) : (
              <ClosedCaptionDisabled sx={{ color: '#fff' }} />
            )}
          </ListItemIcon>
          <ListItemText
            id="more-options-captions-button"
            sx={{
              '& .MuiListItemText-primary': {
                color: !isCaptionEnabled ? 'text.disabled' : 'text.primary',
              },
            }}
          >
            {!isCaptionEnabled
              ? t('Upgrade your plan to support closed captioning')
              : props?.captionsVisible
                ? t('Hide Captions')
                : t('Show Captions')}
          </ListItemText>
        </MenuItem>

        {props?.isPlayOnly === false && !isMobile && !isTablet && (
          <MenuItem onClick={handleScreenShareClick}>
            <ListItemIcon>
              <SvgIcon
                size={24}
                viewBox="0 0 500 500"
                name={'share-screen'}
                color={getMenuIconColor()}
              />
            </ListItemIcon>
            <ListItemText id="more-options-share-screen-button">
              {props?.isScreenShared ? t('You are presenting') : t('Present now')}
            </ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={handleReactionsClick}>
          <ListItemIcon>
            <SvgIcon size={24} viewBox="0 0 500 500" name={'reaction'} color={getMenuIconColor()} />
          </ListItemIcon>
          <ListItemText id="more-options-reactions-button">{t('Reactions')}</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleRaiseHandClick}>
          <ListItemIcon>
            <SvgIcon
              size={24}
              viewBox="0 0 500 500"
              name={'raise-hand'}
              color={getMenuIconColor()}
            />
          </ListItemIcon>
          <ListItemText id="more-options-raise-hand-button">{t('Raise hand')}</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleChatClick}>
          <ListItemIcon>
            <SvgIcon
              size={24}
              viewBox="0 0 500 500"
              name={'message-off'}
              color={getMenuIconColor()}
            />
          </ListItemIcon>
          <ListItemText id={'more-options-chat-button'}>{t('Chat')}</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleParticipantListClick}>
          <ListItemIcon>
            <SvgIcon
              size={24}
              viewBox="0 0 500 500"
              name={'participants'}
              color={getMenuIconColor()}
            />
          </ListItemIcon>
          <ListItemText id={'more-options-participant-list-button'}>
            {t('Participant List')}
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={handleMeetingDetailsClick}>
          <ListItemIcon>
            <SvgIcon size={24} viewBox="0 0 500 500" name={'info'} color={getMenuIconColor()} />
          </ListItemIcon>
          <ListItemText id={'more-options-meeting-details-button'}>
            {t('Meeting details')}
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={isCaptionEnabled ? handleTranscriptionToggle : undefined}
          disabled={!isCaptionEnabled}
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
            id={'more-options-transcription-button'}
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
          onClick={!props?.hideExternalStreams ? handleExternalStreamsToggle : undefined}
          disabled={props?.hideExternalStreams}
        >
          <ListItemIcon>
            <SvgIcon
              size={24}
              viewBox="0 0 512 512"
              name={'database'}
              color={getMenuIconColor()}
              // @ts-ignore
              style={{ opacity: props?.hideExternalStreams ? 0.5 : 1 }}
            />
          </ListItemIcon>
          <ListItemText
            id={'more-options-external-streams-button'}
            primary={
              props?.hideExternalStreams
                ? t('Upgrade your plan to support external streams')
                : t('External Streams')
            }
            sx={{
              '& .MuiListItemText-primary': {
                color: props?.hideExternalStreams ? 'text.disabled' : 'text.primary',
              },
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}

export default MoreOptionsButton;
