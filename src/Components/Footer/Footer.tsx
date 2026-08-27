import React from 'react';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { styled, Theme } from '@mui/material';
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import PersonRemoveAlt1Icon from '@mui/icons-material/PersonRemoveAlt1';
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
import { useParams } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import ReactionsButton from './Components/ReactionsButton.tsx';
import MoreOptionsButton from './Components/MoreOptionsButton.tsx';
import { useTheme } from '@mui/material/styles';
import RaiseHandButton from './Components/RaiseHandButton.tsx';
import CaptionsButton from './Components/CaptionsButton.tsx';
import { Devices } from '../DeviceSelector.tsx';
import LocalRecordingButton from './Components/LocalRecordingButton.tsx';
import { isNull } from 'lodash';
import { getRuntimeConfig } from '../../utils/configStore';

interface FooterProps {
  updateDevicesList: () => void;
  glass?: boolean;
  globals?: any;
  handleSetDesiredTileCount?: (count: number) => void;
  isPlayOnly: boolean;
  effectsDrawerOpen?: boolean;
  handleEffectsOpen?: (open: boolean) => void;
  handleBackgroundReplacement?: (mode: string) => void;
  microphoneSelected?: (mic: string) => void;
  devices?: Devices;
  selectedCamera?: string;
  cameraSelected?: (camera: string) => void;
  selectedMicrophone?: string;
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
}

const getCustomizedGridStyle = (theme: Theme) => {
  const customizedGridStyle = {
    backgroundColor: theme.palette.themeColor?.[80],
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    padding: 16,
    width: '100%',
    zIndex: 101,
  };

  return customizedGridStyle;
};

const CustomizedGrid = styled(Grid)(({ theme }: { theme: Theme }) => getCustomizedGridStyle(theme));

function Footer(props: FooterProps) {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const mobileBreakpoint = 1000;
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const isExternalStreamsEnabled = getRuntimeConfig().VITE_ENABLE_EXTERNAL_STREAMS === 'true';

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLeaveRoom = () => {
    if (props.isLocalRecordingActive) {
      props.stopLocalRecording?.();
    }
    props.setLeftTheRoom?.(true);
  };

  return (
    <CustomizedGrid
      container
      alignItems="center"
      justifyContent={windowWidth > mobileBreakpoint ? 'space-between' : 'center'}
    >
      <Grid sx={{ display: windowWidth > mobileBreakpoint ? 'block' : 'none' }}>
        <Grid container alignItems="center">
          <TimeZone />
          <Typography
            color={theme.palette.text.primary}
            style={{ marginLeft: '6px', marginRight: '6px' }}
            variant="body1"
          >
            |
          </Typography>
          <Typography color={theme.palette.text.primary} variant="body1">
            {id}
          </Typography>
        </Grid>
      </Grid>

      {props?.isPlayOnly === false ? (
        <Grid>
          <Grid container justifyContent="center" spacing={{ xs: 1, sm: 2 }}>
            <Grid size="auto">
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
                //@ts-ignore
                outgoingBitrate={props?.outgoingBitrate}
                //@ts-ignore
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
                //@ts-ignore
                networkScore={props?.networkScore}
                connectionStats={props?.connectionStats}
                currentIssues={props?.currentIssues}
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
                downloadLocalRecording={props?.downloadLocalRecording}
                transcriptionDrawerOpen={props?.transcriptionDrawerOpen}
                handleTranscriptionDrawerOpen={props?.handleTranscriptionDrawerOpen}
              />
            </Grid>

            {props?.isPlayOnly === false ? (
              <Grid size="auto">
                <CameraButton
                  rounded={!props?.isMyCamTurnedOff}
                  glass={props?.glass}
                  showCameraOptions={true}
                  footer={true}
                  isCamTurnedOff={props?.isMyCamTurnedOff}
                  cameraButtonDisabled={props?.cameraButtonDisabled}
                  onTurnOffCamera={props?.checkAndTurnOffLocalCamera}
                  onTurnOnCamera={props?.checkAndTurnOnLocalCamera}
                  videoInputs={props?.devices?.videoInputs}
                  selectedCamera={props?.selectedCamera}
                  onCameraChange={(cam: string) => props?.cameraSelected?.(cam)}
                />
              </Grid>
            ) : null}

            {props?.isPlayOnly === false ? (
              <Grid size="auto">
                <MicButton
                  rounded={!props?.isMyMicMuted}
                  glass={props?.glass}
                  showMicrophoneOptions={true}
                  footer={true}
                  isMicMuted={props?.isMyMicMuted}
                  toggleMic={props?.toggleMic}
                  microphoneButtonDisabled={props?.microphoneButtonDisabled}
                  audioInputs={props?.devices?.audioInputs}
                  selectedMicrophone={props?.selectedMicrophone}
                  onMicrophoneChange={(mic: string) => props?.microphoneSelected?.(mic)}
                />
              </Grid>
            ) : null}

            {props?.isPlayOnly === false &&
            !isMobile &&
            !isTablet &&
            windowWidth > mobileBreakpoint ? (
              <Grid size="auto">
                <ShareScreenButton
                  footer={true}
                  glass={props?.glass}
                  rounded={!props?.isScreenShared}
                  isScreenShared={props?.isScreenShared}
                  handleStartScreenShare={() => props?.handleStartScreenShare?.()}
                  handleStopScreenShare={() => props?.handleStopScreenShare?.()}
                />
              </Grid>
            ) : null}

            {windowWidth > mobileBreakpoint ? (
              <Grid size="auto" style={{ display: '-webkit-inline-box' }}>
                <ReactionsButton
                  footer={true}
                  glass={props?.glass}
                  rounded={!props?.showEmojis}
                  showEmojis={props?.showEmojis}
                  setShowEmojis={(showEmojis: boolean) => props?.setShowEmojis?.(showEmojis)}
                />
              </Grid>
            ) : null}

            {windowWidth > mobileBreakpoint ? (
              <Grid size="auto" style={{ display: '-webkit-inline-box' }}>
                <RaiseHandButton
                  footer={true}
                  glass={props?.glass}
                  rounded={!props?.showRaiseHand}
                  isRaiseHand={props?.isRaiseHand}
                  setIsRaiseHand={(isRaiseHand: boolean) => props?.setIsRaiseHand?.(isRaiseHand)}
                />
              </Grid>
            ) : null}

            {windowWidth > mobileBreakpoint ? (
              <Grid size="auto" style={{ display: '-webkit-inline-box' }}>
                <CaptionsButton
                  footer={true}
                  glass={props?.glass}
                  rounded={!props?.captionsVisible}
                  captionsVisible={props?.captionsVisible}
                  onToggleCaptions={props?.onToggleCaptions}
                />
              </Grid>
            ) : null}

            <Grid size="auto">
              <EndCallButton footer={true} glass={props?.glass} onLeaveRoom={handleLeaveRoom} />
            </Grid>

            {windowWidth <= mobileBreakpoint ? (
              <Grid size="auto">
                <MoreOptionsButton
                  glass={props?.glass}
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
                  handleMessageDrawerOpen={(open: boolean) =>
                    props?.handleMessageDrawerOpen?.(open)
                  }
                  participantListDrawerOpen={props?.participantListDrawerOpen}
                  handleBackgroundReplacement={props.handleBackgroundReplacement}
                  microphoneSelected={(mic: string) => props?.microphoneSelected?.(mic)}
                  selectedSpeaker={props?.selectedSpeaker}
                  speakerSelected={(speaker: string) => props?.speakerSelected?.(speaker)}
                  //@ts-ignore
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
                  //@ts-ignore
                  outgoingBitrate={props?.outgoingBitrate}
                  //@ts-ignore
                  updateOutgoingBitrate={(bitrate: number) =>
                    props?.updateOutgoingBitrate?.(bitrate)
                  }
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
              </Grid>
            ) : null}
          </Grid>
        </Grid>
      ) : null}

      <Grid
        sx={{ display: windowWidth > mobileBreakpoint ? 'block' : 'none' }}
        style={{ zIndex: 999999 }}
      >
        <Grid container alignItems="center">
          <Grid size="auto">
            <InfoButton
              infoDrawerOpen={props?.infoDrawerOpen}
              handleInfoDrawerOpen={props?.handleInfoDrawerOpen}
            />
          </Grid>
          <Grid size="auto">
            <ExternalStreamsButton
              open={props?.externalStreamsDrawerOpen}
              onClick={props?.handleExternalStreamsDrawerOpen}
            />
          </Grid>
          {(props?.isLocalRecordingActive || !isNull(props?.localRecordingStatus)) && (
            <Grid size="auto">
              <LocalRecordingButton
                open={props?.localRecordingDrawerOpen}
                isActive={props?.isLocalRecordingActive}
                onClick={props?.handleLocalRecordingDrawerOpen}
              />
            </Grid>
          )}
          {import.meta.env.DEV && (
            <Grid size="auto">
              <Tooltip title="Add Fake Participant" placement="top">
                <Button
                  variant="text"
                  onClick={() => props?.onAddFakeParticipant?.()}
                  sx={{ ml: 0.5, px: 1, py: 1.5, minWidth: 'unset' }}
                >
                  <PersonAddAlt1Icon sx={{ color: '#FFF', fontSize: 24 }} />
                </Button>
              </Tooltip>
            </Grid>
          )}
          {import.meta.env.DEV && (
            <Grid size="auto">
              <Tooltip title="Remove Fake Participant" placement="top">
                <Button
                  variant="text"
                  onClick={() => props?.onRemoveFakeParticipant?.()}
                  sx={{ ml: 0.5, px: 1, py: 1.5, minWidth: 'unset' }}
                >
                  <PersonRemoveAlt1Icon sx={{ color: '#FFF', fontSize: 24 }} />
                </Button>
              </Tooltip>
            </Grid>
          )}
          <Grid size="auto">
            <ParticipantListButton
              showBackground={false}
              footer={true}
              glass={props?.glass}
              rounded={!props?.participantListDrawerOpen}
              participantCount={props?.participantCount}
              participantListDrawerOpen={props?.participantListDrawerOpen}
              handleParticipantListOpen={(open: boolean) =>
                props?.handleParticipantListOpen?.(open)
              }
            />
          </Grid>
          <Grid size="auto">
            <MessageButton
              showBackground={false}
              footer={true}
              glass={props?.glass}
              rounded={!props?.messageDrawerOpen}
              numberOfUnReadMessages={props?.numberOfUnReadMessages}
              toggleSetNumberOfUnreadMessages={() => props?.toggleSetNumberOfUnreadMessages?.()}
              messageDrawerOpen={props?.messageDrawerOpen}
              handleMessageDrawerOpen={(open: boolean) => props?.handleMessageDrawerOpen?.(open)}
            />
          </Grid>
        </Grid>
      </Grid>
    </CustomizedGrid>
  );
}

export default Footer;
