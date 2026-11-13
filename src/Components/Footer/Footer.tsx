import React from 'react';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { styled, Theme, useTheme } from '@mui/material/styles';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isMobile, isTablet } from 'react-device-detect';
import { isNull } from 'lodash';
import { ControlBar, controlBar, type Devices } from 'truetime-ui';
import InfoButton from './Components/InfoButton.tsx';
import MicButton from './Components/MicButton.tsx';
import CameraButton from './Components/CameraButton.tsx';
import OptionButton from './Components/OptionButton.tsx';
import ShareScreenButton from './Components/ShareScreenButton.tsx';
import MessageButton from './Components/MessageButton.tsx';
import ParticipantListButton from './Components/ParticipantListButton.tsx';
import EndCallButton from './Components/EndCallButton.tsx';
import ExternalStreamsButton from './Components/ExternalStreamsButton.tsx';
import TimeZone from './Components/TimeZone.tsx';
import ReactionsButton from './Components/ReactionsButton.tsx';
import MoreOptionsButton from './Components/MoreOptionsButton.tsx';
import RaiseHandButton from './Components/RaiseHandButton.tsx';
import CaptionsButton from './Components/CaptionsButton.tsx';
import LocalRecordingButton from './Components/LocalRecordingButton.tsx';
import SettingsDialog from './Components/SettingsDialog.tsx';
import { CameraTray, MicTray } from './Components/DeviceTrays.tsx';
import { ReactionsTray } from './Components/ReactionsTray.tsx';
import { getRuntimeConfig } from '../../utils/configStore';
import type { NoiseSuppressionStatus } from '../../hooks/useNoiseSuppression';
import type { RecordingSources } from '../../hooks/useRecording';
import type { ResolutionPreset } from '../../utils/recordingResolution';

interface FooterProps {
  updateDevicesList: () => void;
  glass?: boolean;
  globals?: any;
  handleSetDesiredTileCount?: (count: number) => void;
  isPlayOnly: boolean;
  effectsDrawerOpen?: boolean;
  handleEffectsOpen?: (open: boolean) => void;
  // Takes a virtual background option ({ type, value? }); typed loosely for the legacy buttons
  handleBackgroundReplacement?: (mode: any) => void;
  microphoneSelected?: (mic: string) => void;
  devices?: Devices;
  selectedCamera?: string;
  cameraSelected?: (camera: string) => void;
  selectedMicrophone?: string;
  noiseSuppressionEnabled?: boolean;
  noiseSuppressionStatus?: NoiseSuppressionStatus;
  toggleNoiseSuppression?: (enabled: boolean) => void;
  noiseSuppressionPercent?: number;
  setNoiseSuppressionPercent?: (percent: number) => void;
  selectedSpeaker?: string;
  speakerSelected?: (speaker: string) => void;
  selectedBackgroundMode?: string;
  setSelectedBackgroundMode?: (mode: string) => void;
  layout?: string;
  changeLayout?: (layout: string) => void;
  outgoingBitrate?: number;
  updateOutgoingBitrate?: (bitrate: number) => void;
  isRecordingActive?: boolean;
  startRecord?: (
    recordSeparately?: boolean,
    serverRecording?: boolean,
    localRecording?: boolean,
  ) => void;
  stopRecord?: (serverRecording?: boolean, localRecording?: boolean) => void;
  isLocalRecordingActive?: boolean;
  startLocalRecording?: () => void;
  stopLocalRecording?: () => void;
  applyRecordingResolution?: (
    preset: ResolutionPreset,
    options?: { raiseCamera?: boolean },
  ) => Promise<RecordingSources>;
  downloadLocalRecording?: (filename?: string) => Promise<boolean>;
  networkScore?: number;
  connectionStats?: any;
  currentIssues?: any[];
  printStatLogs?: boolean;
  setPrintStatLogs?: (printStatLogs: boolean) => void;
  pushToTalkEnabled?: boolean;
  onPushToTalkToggle?: (value: boolean) => void;
  pipSupported?: boolean;
  pipIsOpen?: boolean;
  allParticipants?: any[];
  openAllParticipantsPiP?: () => void;
  closePiP?: () => void;
  isMyCamTurnedOff?: boolean;
  cameraButtonDisabled?: boolean;
  checkAndTurnOffLocalCamera?: () => void;
  checkAndTurnOnLocalCamera?: () => void;
  isMyMicMuted?: boolean;
  toggleMic?: (muted?: boolean) => void;
  microphoneButtonDisabled?: boolean;
  isScreenShared?: boolean;
  handleStartScreenShare?: () => void;
  handleStopScreenShare?: () => void;
  showEmojis?: boolean;
  setShowEmojis?: (showEmojis: boolean) => void;
  /** Sends a reaction by its key (see REACTIONS in ReactionsTray). */
  onSendReaction?: (reactionKey: string) => void;
  showRaiseHand?: boolean;
  isRaiseHand?: boolean;
  setIsRaiseHand?: (isRaiseHand: boolean) => void;
  captionsVisible?: boolean;
  onToggleCaptions?: () => void;
  setLeftTheRoom?: (left: boolean) => void;
  messageDrawerOpen?: boolean;
  toggleSetNumberOfUnreadMessages?: (numberOfUnreadMessages?: number) => void;
  handleMessageDrawerOpen?: (open: boolean) => void;
  participantListDrawerOpen?: boolean;
  handleParticipantListOpen?: (open: boolean) => void;
  infoDrawerOpen?: boolean;
  handleInfoDrawerOpen?: (open: boolean) => void;
  localRecordingDrawerOpen?: boolean;
  handleLocalRecordingDrawerOpen?: (open: boolean) => void;
  localRecordingStatus?: string;
  participantCount?: number;
  numberOfUnReadMessages?: number;
  transcriptionDrawerOpen?: boolean;
  handleTranscriptionDrawerOpen?: (open: boolean) => void;
  externalStreamsDrawerOpen?: boolean;
  handleExternalStreamsDrawerOpen?: (open: boolean) => void;
  hideExternalStreams?: boolean;
  onAddFakeParticipant?: () => void;
  onRemoveFakeParticipant?: () => void;
  /** Tile ids of who is talking; ours is `streamName`. */
  talkers?: string[];
  streamName?: string;
}

/** Height the meeting layout leaves free for the footer (see FOOTER_HEIGHT in MeetingPage). */
const FOOTER_HEIGHT = 80;
const BAR_HEIGHT = controlBar.buttonHeight + 2 * controlBar.padding;

const FooterBar = styled('footer')(({ theme }: { theme: Theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  zIndex: 101,
  padding: theme.spacing(0.5, 2),
  display: 'flex',
  // The tray grows the call controls upwards; keep the side groups on the controls' bottom edge
  alignItems: 'flex-end',
  gap: theme.spacing(2),
  // Only the bottom band is footer; above it the tray floats over the video and the rest of the
  // footer's box lets clicks through to the tiles
  pointerEvents: 'none',
  '& > *': { pointerEvents: 'auto' },
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FOOTER_HEIGHT,
    backgroundColor: theme.palette.themeColor?.[80],
    zIndex: -1,
  },
}));

type DeviceTrayKind = 'camera' | 'mic';
type TrayKind = DeviceTrayKind | 'reactions';

const TRAY_ID = 'call-controls-tray';

function Footer(props: FooterProps) {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const mobileBreakpoint = 1000;
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const isExternalStreamsEnabled = getRuntimeConfig().VITE_ENABLE_EXTERNAL_STREAMS === 'true';
  const wide = windowWidth > mobileBreakpoint;

  // Which tray shows above the call controls: a device tray (local state) or the reactions, which
  // follow `showEmojis` so the mobile menu and shortcuts can open them too.
  const [trayOpen, setTrayOpen] = React.useState(false);
  // Opened (or used) with a click: it stays open when the mouse leaves. Hovering opens it unpinned.
  const [trayPinned, setTrayPinned] = React.useState(false);
  const [deviceKind, setDeviceKind] = React.useState<DeviceTrayKind>('camera');
  const shownTray: TrayKind | null = props.showEmojis ? 'reactions' : trayOpen ? deviceKind : null;
  // The last tray shown keeps its content while the tray collapses
  const [trayKind, setTrayKind] = React.useState<TrayKind>('camera');
  if (shownTray && shownTray !== trayKind) {
    setTrayKind(shownTray);
  }
  const [settingsDialog, setSettingsDialog] = React.useState<{
    open: boolean;
    section: 'audio' | 'video';
  }>({ open: false, section: 'video' });

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleTray = (kind: DeviceTrayKind) => {
    if (shownTray === kind) {
      // A click on a tray that hovering opened keeps it open; a second click closes it
      if (trayPinned) {
        setTrayOpen(false);
      } else {
        setTrayPinned(true);
      }
      return;
    }
    if (props.showEmojis) props.setShowEmojis?.(false);
    setDeviceKind(kind);
    setTrayOpen(true);
    setTrayPinned(true);
  };

  // Resting the mouse on the mic or camera options opens their tray, unless the reactions or a tray
  // opened with a click are showing
  const hoverTray = (kind: DeviceTrayKind) => {
    if (shownTray === kind || props.showEmojis || (trayOpen && trayPinned)) return;
    setDeviceKind(kind);
    setTrayOpen(true);
    setTrayPinned(false);
  };

  const handleHoverEnd = () => {
    if (trayOpen && !trayPinned && !props.showEmojis) setTrayOpen(false);
  };

  const toggleReactions = () => {
    setTrayOpen(false);
    props.setShowEmojis?.(!props.showEmojis);
  };

  const closeTray = () => {
    if (shownTray === 'reactions') {
      props.setShowEmojis?.(false);
      document.getElementById('reactions-button')?.focus();
      return;
    }
    setTrayOpen(false);
    document
      .getElementById(`${deviceKind === 'camera' ? 'camera' : 'mic'}-button-options`)
      ?.focus();
  };

  const openSettings = (section: 'audio' | 'video') => {
    setTrayOpen(false);
    setSettingsDialog({ open: true, section });
  };

  const openEffects = () => {
    setTrayOpen(false);
    props.handleEffectsOpen?.(true);
  };

  const handleLeaveRoom = () => {
    if (props.isLocalRecordingActive) {
      props.stopLocalRecording?.();
    }
    props.setLeftTheRoom?.(true);
  };

  const isTalking = Boolean(props.streamName && props.talkers?.includes(props.streamName));

  const trayLabels: Record<TrayKind, string> = {
    camera: t('Camera options'),
    mic: t('Microphone options'),
    reactions: t('Emoji reactions'),
  };

  const tray =
    trayKind === 'reactions' ? (
      <ReactionsTray onSend={(reactionKey) => props.onSendReaction?.(reactionKey)} />
    ) : trayKind === 'camera' ? (
      <CameraTray
        videoInputs={props.devices?.videoInputs}
        selectedCamera={props.selectedCamera}
        onCameraChange={(camera: string) => props.cameraSelected?.(camera)}
        onOpenEffects={openEffects}
        onOpenSettings={() => openSettings('video')}
      />
    ) : (
      <MicTray
        audioInputs={props.devices?.audioInputs}
        audioOutputs={props.devices?.audioOutputs}
        selectedMicrophone={props.selectedMicrophone}
        onMicrophoneChange={(mic: string) => props.microphoneSelected?.(mic)}
        selectedSpeaker={props.selectedSpeaker}
        onSpeakerChange={(speaker: string) => props.speakerSelected?.(speaker)}
        isMicMuted={props.isMyMicMuted}
        noiseSuppressionEnabled={props.noiseSuppressionEnabled}
        noiseSuppressionStatus={props.noiseSuppressionStatus}
        onNoiseSuppressionChange={props.toggleNoiseSuppression}
        onOpenSettings={() => openSettings('audio')}
      />
    );

  return (
    <FooterBar>
      <SettingsDialog
        open={settingsDialog.open}
        onClose={() => setSettingsDialog((current) => ({ ...current, open: false }))}
        section={settingsDialog.section}
        devices={props.devices}
        selectedCamera={props.selectedCamera}
        cameraSelected={props.cameraSelected}
        selectedMicrophone={props.selectedMicrophone}
        microphoneSelected={props.microphoneSelected}
        selectedSpeaker={props.selectedSpeaker}
        speakerSelected={props.speakerSelected}
        selectedBackgroundMode={props.selectedBackgroundMode}
        setSelectedBackgroundMode={props.setSelectedBackgroundMode}
        outgoingBitrate={
          props.outgoingBitrate !== undefined ? String(props.outgoingBitrate) : undefined
        }
        updateOutgoingBitrate={(bitrate: string) => props.updateOutgoingBitrate?.(Number(bitrate))}
        pushToTalkEnabled={props.pushToTalkEnabled}
        onPushToTalkToggle={props.onPushToTalkToggle}
        noiseSuppressionEnabled={props.noiseSuppressionEnabled}
        noiseSuppressionStatus={props.noiseSuppressionStatus}
        onNoiseSuppressionToggle={props.toggleNoiseSuppression}
        noiseSuppressionPercent={props.noiseSuppressionPercent}
        onNoiseSuppressionPercentChange={props.setNoiseSuppressionPercent}
      />

      {/* Meeting time and id */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: wide ? 'flex' : 'none',
          alignItems: 'center',
          height: BAR_HEIGHT,
        }}
      >
        <TimeZone />
        <Typography color={theme.palette.text.primary} sx={{ mx: 0.75 }} variant="body1">
          |
        </Typography>
        <Typography color={theme.palette.text.primary} variant="body1" noWrap>
          {id}
        </Typography>
      </Box>

      {props?.isPlayOnly === false ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flex: wide ? '0 1 auto' : 1,
            minWidth: 0,
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' },
          }}
        >
          <ControlBar
            label={t('Call controls')}
            tray={
              // display: contents keeps the tray's own layout; a click inside pins a hovered tray
              <Box sx={{ display: 'contents' }} onClickCapture={() => setTrayPinned(true)}>
                {tray}
              </Box>
            }
            trayOpen={shownTray !== null}
            trayId={TRAY_ID}
            trayLabel={trayLabels[trayKind]}
            onTrayClose={closeTray}
            onHoverEnd={handleHoverEnd}
          >
            <MicButton
              isMicMuted={props?.isMyMicMuted}
              toggleMic={props?.toggleMic}
              microphoneButtonDisabled={props?.microphoneButtonDisabled}
              audioInputs={props?.devices?.audioInputs}
              selectedMicrophone={props?.selectedMicrophone}
              onMicrophoneChange={(mic: string) => props?.microphoneSelected?.(mic)}
              optionsOpen={shownTray === 'mic'}
              optionsControls={TRAY_ID}
              onOptionsClick={() => toggleTray('mic')}
              onOptionsHover={() => hoverTray('mic')}
              isTalking={isTalking}
            />
            <CameraButton
              isCamTurnedOff={props?.isMyCamTurnedOff}
              cameraButtonDisabled={props?.cameraButtonDisabled}
              onTurnOffCamera={props?.checkAndTurnOffLocalCamera}
              onTurnOnCamera={props?.checkAndTurnOnLocalCamera}
              videoInputs={props?.devices?.videoInputs}
              selectedCamera={props?.selectedCamera}
              onCameraChange={(cam: string) => props?.cameraSelected?.(cam)}
              optionsOpen={shownTray === 'camera'}
              optionsControls={TRAY_ID}
              onOptionsClick={() => toggleTray('camera')}
              onOptionsHover={() => hoverTray('camera')}
            />

            {!isMobile && !isTablet && wide ? (
              <ShareScreenButton
                isScreenShared={props?.isScreenShared}
                handleStartScreenShare={() => props?.handleStartScreenShare?.()}
                handleStopScreenShare={() => props?.handleStopScreenShare?.()}
              />
            ) : null}

            {wide ? (
              <ReactionsButton
                showEmojis={props?.showEmojis}
                setShowEmojis={toggleReactions}
                controls={TRAY_ID}
              />
            ) : null}

            {wide ? (
              <CaptionsButton
                captionsVisible={props?.captionsVisible}
                onToggleCaptions={props?.onToggleCaptions}
              />
            ) : null}

            {wide ? (
              <RaiseHandButton
                isRaiseHand={props?.isRaiseHand}
                setIsRaiseHand={(isRaiseHand: boolean) => props?.setIsRaiseHand?.(isRaiseHand)}
              />
            ) : null}

            {wide ? (
              <OptionButton
                footer={true}
                glass={props?.glass}
                globals={props?.globals}
                handleSetDesiredTileCount={props?.handleSetDesiredTileCount}
                isPlayOnly={props?.isPlayOnly}
                effectsDrawerOpen={props?.effectsDrawerOpen}
                handleEffectsOpen={props?.handleEffectsOpen}
                handleBackgroundReplacement={props.handleBackgroundReplacement}
                microphoneSelected={(mic: string) => props?.microphoneSelected?.(mic)}
                devices={props?.devices}
                updateDevicesList={() => props?.updateDevicesList()}
                selectedCamera={props?.selectedCamera}
                cameraSelected={(camera: string) => props?.cameraSelected?.(camera)}
                selectedMicrophone={props?.selectedMicrophone}
                selectedSpeaker={props?.selectedSpeaker}
                speakerSelected={(speaker: string) => props?.speakerSelected?.(speaker)}
                selectedBackgroundMode={props?.selectedBackgroundMode}
                setSelectedBackgroundMode={(mode: string) =>
                  props?.setSelectedBackgroundMode?.(mode)
                }
                layout={props?.layout}
                changeLayout={(layout: string) => props?.changeLayout?.(layout)}
                //@ts-expect-error - prop type mismatch with legacy component props
                outgoingBitrate={props?.outgoingBitrate}
                //@ts-expect-error - callback param type mismatch with legacy types
                updateOutgoingBitrate={(bitrate: number) => props?.updateOutgoingBitrate?.(bitrate)}
                isRecordingActive={props?.isRecordingActive}
                startRecord={(
                  recordSeparately?: boolean,
                  serverRecording?: boolean,
                  localRecording?: boolean,
                ) => props?.startRecord?.(recordSeparately, serverRecording, localRecording)}
                stopRecord={(serverRecording?: boolean, localRecording?: boolean) =>
                  props?.stopRecord?.(serverRecording, localRecording)
                }
                //@ts-expect-error - prop type mismatch with legacy component props
                networkScore={props?.networkScore}
                connectionStats={props?.connectionStats}
                currentIssues={props?.currentIssues}
                noiseSuppressionEnabled={props?.noiseSuppressionEnabled}
                noiseSuppressionStatus={props?.noiseSuppressionStatus}
                toggleNoiseSuppression={props?.toggleNoiseSuppression}
                noiseSuppressionPercent={props?.noiseSuppressionPercent}
                setNoiseSuppressionPercent={props?.setNoiseSuppressionPercent}
                printStatLogs={props?.printStatLogs}
                setPrintStatLogs={(printStatLogs: boolean) =>
                  props?.setPrintStatLogs?.(printStatLogs)
                }
                pushToTalkEnabled={props?.pushToTalkEnabled}
                onPushToTalkToggle={(value: boolean) => props?.onPushToTalkToggle?.(value)}
                pipSupported={props?.pipSupported}
                pipIsOpen={props?.pipIsOpen}
                allParticipants={props?.allParticipants}
                openAllParticipantsPiP={props?.openAllParticipantsPiP}
                closePiP={props?.closePiP}
                isLocalRecordingActive={props?.isLocalRecordingActive}
                startLocalRecording={props?.startLocalRecording}
                stopLocalRecording={props?.stopLocalRecording}
                applyRecordingResolution={props?.applyRecordingResolution}
                downloadLocalRecording={props?.downloadLocalRecording}
                transcriptionDrawerOpen={props?.transcriptionDrawerOpen}
                handleTranscriptionDrawerOpen={props?.handleTranscriptionDrawerOpen}
                onAddFakeParticipant={props?.onAddFakeParticipant}
                onRemoveFakeParticipant={props?.onRemoveFakeParticipant}
              />
            ) : (
              <MoreOptionsButton
                glass={props?.glass}
                onAddFakeParticipant={props?.onAddFakeParticipant}
                onRemoveFakeParticipant={props?.onRemoveFakeParticipant}
                noiseSuppressionEnabled={props?.noiseSuppressionEnabled}
                noiseSuppressionStatus={props?.noiseSuppressionStatus}
                toggleNoiseSuppression={props?.toggleNoiseSuppression}
                noiseSuppressionPercent={props?.noiseSuppressionPercent}
                setNoiseSuppressionPercent={props?.setNoiseSuppressionPercent}
                footer={true}
                isPlayOnly={props?.isPlayOnly}
                isScreenShared={props?.isScreenShared}
                handleStartScreenShare={props?.handleStartScreenShare}
                handleStopScreenShare={props?.handleStopScreenShare}
                showEmojis={props?.showEmojis}
                setShowEmojis={(showEmojis: boolean) => props?.setShowEmojis?.(showEmojis)}
                messageDrawerOpen={props?.messageDrawerOpen}
                toggleSetNumberOfUnreadMessages={(numberOfUnreadMessages?: number) =>
                  props?.toggleSetNumberOfUnreadMessages?.(numberOfUnreadMessages)
                }
                handleMessageDrawerOpen={(open: boolean) => props?.handleMessageDrawerOpen?.(open)}
                participantListDrawerOpen={props?.participantListDrawerOpen}
                handleBackgroundReplacement={props.handleBackgroundReplacement}
                microphoneSelected={(mic: string) => props?.microphoneSelected?.(mic)}
                selectedSpeaker={props?.selectedSpeaker}
                speakerSelected={(speaker: string) => props?.speakerSelected?.(speaker)}
                devices={props?.devices}
                updateDevicesList={props?.updateDevicesList}
                selectedCamera={props?.selectedCamera}
                cameraSelected={(camera: string) => props?.cameraSelected?.(camera)}
                selectedMicrophone={props?.selectedMicrophone}
                selectedBackgroundMode={props?.selectedBackgroundMode}
                setSelectedBackgroundMode={(mode: string) =>
                  props?.setSelectedBackgroundMode?.(mode)
                }
                globals={props?.globals}
                handleParticipantListOpen={(open: boolean) =>
                  props?.handleParticipantListOpen?.(open)
                }
                //@ts-expect-error - prop type mismatch with legacy component props
                outgoingBitrate={props?.outgoingBitrate}
                //@ts-expect-error - callback param type mismatch with legacy types
                updateOutgoingBitrate={(bitrate: number) => props?.updateOutgoingBitrate?.(bitrate)}
                captionsVisible={props?.captionsVisible}
                onToggleCaptions={props?.onToggleCaptions}
                isRaiseHand={props?.isRaiseHand}
                setIsRaiseHand={(isRaiseHand: boolean) => props?.setIsRaiseHand?.(isRaiseHand)}
                infoDrawerOpen={props?.infoDrawerOpen}
                handleInfoDrawerOpen={(infoDrawerOpen: boolean) =>
                  props?.handleInfoDrawerOpen?.(infoDrawerOpen)
                }
                transcriptionDrawerOpen={props?.transcriptionDrawerOpen}
                handleTranscriptionDrawerOpen={(open: boolean) =>
                  props?.handleTranscriptionDrawerOpen?.(open)
                }
                externalStreamsDrawerOpen={props?.externalStreamsDrawerOpen}
                handleExternalStreamsDrawerOpen={props?.handleExternalStreamsDrawerOpen}
                hideExternalStreams={!isExternalStreamsEnabled}
              />
            )}

            <EndCallButton onLeaveRoom={handleLeaveRoom} />
          </ControlBar>
        </Box>
      ) : null}

      {/* Meeting tools */}
      <Box
        sx={{ flex: 1, minWidth: 0, display: wide ? 'flex' : 'none', justifyContent: 'flex-end' }}
      >
        <ControlBar label={t('Meeting tools')}>
          <InfoButton
            infoDrawerOpen={props?.infoDrawerOpen}
            handleInfoDrawerOpen={props?.handleInfoDrawerOpen}
          />
          <ExternalStreamsButton
            open={props?.externalStreamsDrawerOpen}
            onClick={props?.handleExternalStreamsDrawerOpen}
          />
          {(props?.isLocalRecordingActive || !isNull(props?.localRecordingStatus)) && (
            <LocalRecordingButton
              open={props?.localRecordingDrawerOpen}
              isActive={props?.isLocalRecordingActive}
              onClick={props?.handleLocalRecordingDrawerOpen}
            />
          )}
          <ParticipantListButton
            participantCount={props?.participantCount}
            participantListDrawerOpen={props?.participantListDrawerOpen}
            handleParticipantListOpen={(open: boolean) => props?.handleParticipantListOpen?.(open)}
          />
          <MessageButton
            numberOfUnReadMessages={props?.numberOfUnReadMessages}
            toggleSetNumberOfUnreadMessages={() => props?.toggleSetNumberOfUnreadMessages?.()}
            messageDrawerOpen={props?.messageDrawerOpen}
            handleMessageDrawerOpen={(open: boolean) => props?.handleMessageDrawerOpen?.(open)}
          />
        </ControlBar>
      </Box>
    </FooterBar>
  );
}

export default Footer;
