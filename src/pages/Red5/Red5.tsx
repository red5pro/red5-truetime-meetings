// Red5.tsx
// @ts-nocheck
import { useEffect, useCallback, useRef, ReactNode } from 'react';
import { Backdrop, Button, CircularProgress, Grid } from '@mui/material';
import { useBeforeUnload, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Stack from '@mui/material/Stack';

// Components
import LobbyPage from '../Lobby/LobbyPage.tsx';
import MeetingPage from '../Meeting/MeetingPage.tsx';
import MessageDrawer from '../../Components/MessageDrawer.tsx';
import LeftTheRoom from '../LeftTheRoom/LeftTheRoom.tsx';
import ParticipantListDrawer from '../../Components/ParticipantListDrawer.tsx';
import EffectsDrawer from '../../Components/EffectsDrawer.tsx';
import InfoDrawer from '../../Components/InfoDrawer.tsx';
import { UnauthorizedDialog } from '../../Components/Footer/Components/UnauthorizedDialog.tsx';
import MeetingPermissionDialog from '../../Components/PermissionDialog.tsx';
import LocalRecordingDrawer from '../../Components/LocalRecordingDrawer.tsx';
import TranscriptionDrawer from '../../Components/TranscriptionDrawer.tsx';
import ExternalStreamsDrawer from '../../Components/ExternalStreamsDrawer.tsx';

// Master hook
import { useConference } from '../../hooks/useConference.ts';

// Utils
import { setupPeerConnectionConfig } from '../../utils/utils.tsx';
import log from 'loglevel';
import { sharedVariables } from '../../constants/config.ts';
import GuestWaiting from '../GuestWaiting/GuestWaiting.tsx';

// Setup peer connection config
setupPeerConnectionConfig();

interface Red5Props {
  children?: ReactNode;
}

function Red5(props: Red5Props) {
  const { t } = useTranslation();
  const { id: roomId } = useParams<{ id: string }>();

  const conference = useConference(roomId);

  // Use refs to store latest conference references without triggering re-renders
  const conferenceRef = useRef(conference);

  // Keep ref up to date
  useEffect(() => {
    conferenceRef.current = conference;
  }, [conference]);

  useBeforeUnload(
    useCallback((event) => {
      if (conferenceRef.current.features.localRecording.isLocalRecordingActive) {
        conferenceRef.current.features.localRecording.stopLocalRecording();
      }

      if (
        conferenceRef.current.features.localRecording.isLocalRecordingActive ||
        conferenceRef.current.features.localRecording.isUploading
      ) {
        event.preventDefault();
        const message = 'Local recording is uploading, please wait.';
        event.returnValue = message; // Trigger browser confirmation dialog
        return message;
      }
      conferenceRef.current.room.leaveRoom().then(() => log.log('Left from room.'));
    }, []),
  );

  // Legacy functions that will be moved to hooks in future iterations
  const scrollToBottom = useCallback(() => {
    const objDiv = document.getElementById('paper-props');
    if (objDiv && sharedVariables.scroll_down && objDiv.scrollHeight > objDiv.clientHeight) {
      objDiv.scrollTo(0, objDiv.scrollHeight);
      sharedVariables.scrollThreshold = 0.95;
      sharedVariables.scroll_down = false;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conference.features.chat.messages, scrollToBottom]);

  const makeFullScreen = useCallback((divId: string) => {
    // @ts-ignore
    if (sharedVariables.fullScreenId === divId) {
      document.getElementById(divId)?.classList.remove('selected');
      document.getElementById(divId)?.classList.add('unselected');
      sharedVariables.fullScreenId = -1;
    } else {
      const publisherContent = document.getElementsByClassName(
        'publisher-content',
      )[0] as HTMLElement;
      if (publisherContent) {
        publisherContent.className = 'publisher-content chat-active fullscreen-layout';
      }
      if (sharedVariables.fullScreenId !== -1) {
        // @ts-ignore
        document.getElementById(sharedVariables.fullScreenId)?.classList.remove('selected');
        // @ts-ignore
        document.getElementById(sharedVariables.fullScreenId)?.classList.add('unselected');
      }
      document.getElementById(divId)?.classList.remove('unselected');
      document.getElementById(divId)?.classList.add('selected');
      // @ts-ignore
      sharedVariables.fullScreenId = divId;
    }
  }, []);

  useEffect(() => {
    (window as any).makeFullScreen = makeFullScreen;
    return () => {
      delete (window as any).makeFullScreen;
    };
  }, [makeFullScreen]);

  const handleSetDesiredTileCount = useCallback((maxTrackCount: number) => {
    sharedVariables.desiredTileCount = maxTrackCount;
    // This will be moved to conference.room in future iterations
    const { saveDesiredTileCount } = require('../../utils/conferenceConfig.ts');
    saveDesiredTileCount(maxTrackCount);
  }, []);

  const turnOffYourMicNotification = useCallback((participantId: string) => {
    conferenceRef.current.room.sendNotificationEvent(
      'TURN_YOUR_MIC_OFF',
      conferenceRef.current.room.publishStreamIdRef.current,
      {
        streamId: participantId,
        senderStreamId: conferenceRef.current.room.publishStreamIdRef.current,
        senderStreamName: conferenceRef.current.room.streamName,
      },
    );
  }, []);

  const toggleSetNumberOfUnreadMessages = useCallback((numb: number) => {
    conferenceRef.current.features.chat.setNumberOfUnReadMessages(numb);
  }, []);

  const handleUnauthorizedDialogExitClicked = useCallback(() => {
    conferenceRef.current.ui.setUnAuthorizedDialogOpen(false);
    conferenceRef.current.room.setLobbyOrMeetingPage('lobby');
  }, []);

  return (
    <Grid container className="App">
      <Grid container className="App-header" justifyContent="center" alignItems="center">
        {props.children}

        {/* Dialogs */}
        <UnauthorizedDialog
          onClose={handleUnauthorizedDialogExitClicked}
          open={conference.ui.unAuthorizedDialogOpen}
          //@ts-ignore
          onExitClicked={handleUnauthorizedDialogExitClicked}
          message={conference.ui.unAuthorizedDialogMessage}
        />

        <MeetingPermissionDialog
          open={conference.ui.permissions.isPermissionDialogVisible}
          setIsPermissionDialogVisible={conference.ui.permissions.setIsPermissionDialogVisible}
          //@ts-ignore
          requestPermissions={conference.ui.permissions.requestPermissions}
          localVideoCreate={conference.media.localVideoCreate}
          updateDevicesList={conference.media.updateDevicesList}
          setCameraPermissionState={conference.ui.permissions.setCameraPermissionState}
          setMicrophonePermissionState={conference.ui.permissions.setMicrophonePermissionState}
        />

        {/* Loading States */}
        {conference.room.isJoining && (
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={conference.room.isJoining}
          >
            <Stack alignItems="center" justifyContent="center" alignContent="center">
              <CircularProgress size={52} color="inherit" />
              {conference.room.isWaitingApproval ? (
                <>
                  <span style={{ margin: '27px', fontSize: 18, fontWeight: 'normal' }}>
                    {t('Waiting for approval...')}
                  </span>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="medium"
                    onClick={() => {
                      conference.room.setIsJoining(false);
                      conference.room.setIsWaitingApproval(false);
                      conference.room.leaveRoom();
                    }}
                    sx={{
                      mt: 1,
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    {t('Cancel')}
                  </Button>
                </>
              ) : Object.keys(conference.participants.participants).length === 0 &&
                conference.room.isPlayOnly ? (
                <span style={{ margin: '27px', fontSize: 18, fontWeight: 'normal' }}>
                  <b>{t('The room is currently empty.')}</b>
                  <br />
                  <b>{t('You will automatically join the room once it is ready.')}</b>
                </span>
              ) : (
                <span style={{ margin: '27px', fontSize: 18, fontWeight: 'normal' }}>
                  {t('Joining the room...')}
                </span>
              )}
            </Stack>
          </Backdrop>
        )}

        {conference.features.screenShare.showScreenShareSpinner?.current && (
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={conference.features.screenShare.showScreenShareSpinner.current}
          >
            <Stack alignItems="center" justifyContent="center" alignContent="center">
              <CircularProgress size={52} color="inherit" />
              <span style={{ margin: '27px', fontSize: 18, fontWeight: 'normal' }}>
                {t('Screen Share Starting...')}
              </span>
            </Stack>
          </Backdrop>
        )}

        {conference.ui.transcriptionDrawerOpen && (
          <TranscriptionDrawer
            open={conference.ui.transcriptionDrawerOpen}
            onClose={conference.ui.handleTranscriptionDrawerOpen}
            fetchTranscriptions={conference.features.transcription.fetchTranscriptions}
            loading={conference.features.transcription.loading}
            error={conference.features.transcription.error}
            data={conference.features.transcription.data}
          />
        )}

        {/* Main Content */}

        {conference.room.leftTheRoom ? (
          <LeftTheRoom
            withError={null} // This would come from conference.room in future
            handleLeaveFromRoom={conference.room.leaveRoom}
          />
        ) : conference.room.lobbyOrMeetingPage === 'lobby' ? (
          <LobbyPage
            // Room state
            streamName={conference.room.streamName}
            setStreamName={conference.room.setStreamName}
            joinRoom={conference.room.joinRoom}
            isPlayOnly={conference.room.isPlayOnly}
            isPublished={conference.room.isPublished}
            publishStreamId={conference.room.publishStreamIdRef?.current}
            setIsJoining={conference.room.setIsJoining}
            setIsWaitingApproval={conference.room.setIsWaitingApproval}
            // Media controls
            isMyCamTurnedOff={conference.media.isMyCamTurnedOff}
            isMyMicMuted={conference.media.isMyMicMuted}
            toggleMic={conference.media.toggleMic}
            cameraButtonDisabled={conference.media.cameraButtonDisabled}
            microphoneButtonDisabled={conference.media.microphoneButtonDisabled}
            handleMuteVideoLobby={() =>
              conference.media.toggleCamera(!conference.media.isMyCamTurnedOff)
            }
            // Device management
            devices={conference.media.devices}
            selectedCamera={conference.media.selectedCamera}
            selectedMicrophone={conference.media.selectedMicrophone}
            selectedSpeaker={conference.media.selectedSpeaker}
            cameraSelected={conference.media.cameraSelected}
            microphoneSelected={conference.media.microphoneSelected}
            speakerSelected={conference.media.speakerSelected}
            // Permissions
            cameraPermissionState={conference.ui.permissions.cameraPermissionState}
            microphonePermissionState={conference.ui.permissions.microphonePermissionState}
            //@ts-ignore
            updatePermissions={conference.ui.permissions.updatePermissions}
            // Virtual background
            selectedBackgroundMode={conference.features.virtualBackground.selectedBackgroundMode}
            setSelectedBackgroundMode={
              conference.features.virtualBackground.setSelectedBackgroundMode
            }
            handleBackgroundReplacement={
              conference.features.virtualBackground.handleBackgroundReplacement
            }
            setVirtualBackgroundImage={
              conference.features.virtualBackground.setVirtualBackgroundImage
            }
            // Conference settings
            role={conference.ui.role}
            setRole={conference.ui.setRole}
            layout={conference.ui.layout}
            outgoingBitrate={conference.ui.outgoingBitrate}
            updateOutgoingBitrate={conference.ui.updateOutgoingBitrate}
            // UI state
            glass={conference.ui.isGlassmorphic}
            talkers={conference.participants.talkers}
            // Drawer controls
            effectsDrawerOpen={conference.ui.effectsDrawerOpen}
            handleInfoDrawerOpen={conference.ui.handleInfoDrawerOpen}
            handleMessageDrawerOpen={conference.ui.handleMessageDrawerOpen}
            handleParticipantListOpen={conference.ui.handleParticipantListOpen}
            handleEffectsOpen={conference.ui.handleEffectsOpen}
          />
        ) : (
          <>
            <MeetingPage
              // Core meeting data
              participants={conference.participants.participants}
              subscribedParticipants={conference.participants.subscribedParticipants}
              publishStreamId={conference.room.publishStreamIdRef?.current}
              streamName={conference.room.streamName}
              participantCount={Object.entries(conference.participants.participants).length + 1}
              isPublished={conference.room.isPublished}
              isPlayOnly={conference.room.isPlayOnly}
              // Media controls
              isMyMicMuted={conference.media.isMyMicMuted}
              isMyCamTurnedOff={conference.media.isMyCamTurnedOff}
              cameraButtonDisabled={conference.media.cameraButtonDisabled}
              microphoneButtonDisabled={conference.media.microphoneButtonDisabled}
              toggleMic={conference.media.toggleMic}
              checkAndTurnOffLocalCamera={() => conference.media.toggleCamera(true)}
              checkAndTurnOnLocalCamera={() => conference.media.toggleCamera(false)}
              // Device management
              devices={conference.media.devices}
              updateDevicesList={conference.media.updateDevicesList}
              selectedCamera={conference.media.selectedCamera}
              selectedMicrophone={conference.media.selectedMicrophone}
              selectedSpeaker={conference.media.selectedSpeaker}
              cameraSelected={conference.media.cameraSelected}
              microphoneSelected={conference.media.microphoneSelected}
              speakerSelected={conference.media.speakerSelected}
              updateAudioOutput={conference.media.speakerSelected}
              // Screen sharing
              isScreenShared={conference.features.screenShare.isScreenShared}
              isStartingScreenShare={conference.features.screenShare.isStartingScreenShare}
              handleStartScreenShare={conference.features.screenShare.handleStartScreenShare}
              handleStopScreenShare={conference.features.screenShare.handleStopScreenShare}
              // Recording
              isRecordingActive={conference.features.recording.isRecordingActive}
              didIStartServerRecording={conference.features.recording.didIStartServerRecording}
              startRecord={(
                recordSeparately?: boolean,
                serverRecording?: boolean,
                localRecording?: boolean,
              ) =>
                conference.features.recording.startRecording(
                  recordSeparately,
                  serverRecording,
                  localRecording,
                )
              }
              stopRecord={(serverRecording?: boolean, localRecording?: boolean) =>
                conference.features.recording.stopRecording(serverRecording, localRecording)
              }
              // Local Recording
              isLocalRecordingActive={conference.features.localRecording.isLocalRecordingActive}
              startLocalRecording={conference.features.localRecording.startLocalRecording}
              stopLocalRecording={conference.features.localRecording.stopLocalRecording}
              downloadLocalRecording={conference.features.localRecording.downloadLocalRecording}
              localRecordingStatus={conference.features.localRecording.localRecordingStatus}
              isLocalRecordingUploading={conference.features.localRecording.isUploading}
              // Chat
              numberOfUnReadMessages={conference.features.chat.numberOfUnReadMessages}
              toggleSetNumberOfUnreadMessages={toggleSetNumberOfUnreadMessages}
              // Virtual background
              selectedBackgroundMode={conference.features.virtualBackground.selectedBackgroundMode}
              setSelectedBackgroundMode={
                conference.features.virtualBackground.setSelectedBackgroundMode
              }
              handleBackgroundReplacement={
                conference.features.virtualBackground.handleBackgroundReplacement
              }
              // Reactions and interactions
              showEmojis={conference.ui.showEmojis}
              setShowEmojis={conference.ui.setShowEmojis}
              sendReactions={conference.room.sendReactions}
              isRaiseHand={conference.ui.isRaiseHand}
              setIsRaiseHand={conference.room.setIsRaiseHand}
              raisedHands={conference.participants.raisedHands}
              // Video layout
              pinnedParticipantId={conference.participants.pinnedParticipantId}
              pinVideo={conference.room.pinVideo}
              unpinVideo={conference.room.unpinVideo}
              layout={conference.ui.layout}
              changeLayout={conference.ui.changeLayout}
              // Audio levels
              talkers={conference.participants.talkers}
              talkerAudioLevels={conference.participants.talkerAudioLevelsRef?.current || {}}
              // Drawer states
              messageDrawerOpen={conference.ui.messageDrawerOpen}
              participantListDrawerOpen={conference.ui.participantListDrawerOpen}
              effectsDrawerOpen={conference.ui.effectsDrawerOpen}
              infoDrawerOpen={conference.ui.infoDrawerOpen}
              localRecordingDrawerOpen={conference.ui.localRecordingDrawerOpen}
              handleInfoDrawerOpen={conference.ui.handleInfoDrawerOpen}
              handleMessageDrawerOpen={conference.ui.handleMessageDrawerOpen}
              handleParticipantListOpen={conference.ui.handleParticipantListOpen}
              handleEffectsOpen={conference.ui.handleEffectsOpen}
              handleLocalRecordingDrawerOpen={conference.ui.handleLocalRecordingDrawerOpen}
              // Actions
              setLeftTheRoom={conference.room.setLeftTheRoom}
              handleSetDesiredTileCount={handleSetDesiredTileCount}
              turnOffYourMicNotification={turnOffYourMicNotification}
              // Conference settings
              outgoingBitrate={conference.ui.outgoingBitrate}
              updateOutgoingBitrate={conference.ui.updateOutgoingBitrate}
              // Admin controls
              isMuteParticipantDialogOpen={conference.ui.isMuteParticipantDialogOpen}
              setMuteParticipantDialogOpen={conference.ui.setMuteParticipantDialogOpen}
              participantIdMuted={conference.ui.participantIdMuted}
              setParticipantIdMuted={conference.ui.setParticipantIdMuted}
              // Monitoring
              networkScore={conference.ui.networkScore}
              connectionStats={conference.ui.connectionStats}
              currentIssues={conference.ui.currentIssues}
              printStatLogs={conference.ui.printStatLogs}
              setPrintStatLogs={conference.ui.setPrintStatLogs}
              // Features
              closedCaptions={conference.features.closedCaptions}
              currentConferenceClient={conference.client.conferenceClient?.current}
              transcription={conference.features.transcription}
              transcriptionDrawerOpen={conference.ui.transcriptionDrawerOpen}
              handleTranscriptionDrawerOpen={conference.ui.handleTranscriptionDrawerOpen}
              // UI state
              glass={conference.ui.isGlassmorphic}
              globals={sharedVariables}
              // External Streams
              externalStreamsDrawerOpen={conference.ui.externalStreamsDrawerOpen}
              handleExternalStreamsDrawerOpen={conference.ui.handleExternalStreamsDrawerOpen}
            />

            {/* Drawers */}
            <MessageDrawer
              messages={conference.features.chat.messages}
              sendMessage={conference.features.chat.handleSendMessage}
              handleSetMessages={conference.features.chat.handleSetMessages}
              messageDrawerOpen={conference.ui.messageDrawerOpen}
              handleInfoDrawerOpen={conference.ui.handleInfoDrawerOpen}
              handleMessageDrawerOpen={conference.ui.handleMessageDrawerOpen}
              handleParticipantListOpen={conference.ui.handleParticipantListOpen}
              handleEffectsOpen={conference.ui.handleEffectsOpen}
              handleLocalRecordingDrawerOpen={(open: boolean) =>
                conference.ui.handleLocalRecordingDrawerOpen?.(open)
              }
              handleTranscriptionDrawerOpen={(open: boolean) =>
                conference.ui.handleTranscriptionDrawerOpen?.(open)
              }
            />

            <ParticipantListDrawer
              globals={sharedVariables}
              participantCount={Object.entries(conference.participants.participants).length + 1}
              isMyMicMuted={conference.media.isMyMicMuted}
              publishStreamId={conference.room.publishStreamIdRef?.current}
              muteLocalMic={() => conference.media.toggleMic(true)}
              participants={conference.participants.participants}
              role={conference.ui.role}
              blockUser={conference.room.blockUser}
              participantListDrawerOpen={conference.ui.participantListDrawerOpen}
              handleInfoDrawerOpen={conference.ui.handleInfoDrawerOpen}
              handleMessageDrawerOpen={conference.ui.handleMessageDrawerOpen}
              handleParticipantListOpen={conference.ui.handleParticipantListOpen}
              handleEffectsOpen={conference.ui.handleEffectsOpen}
              guestsWaitingApproval={conference.participants.guestsWaitingApproval}
              approveGuest={conference.room.approveGuestJoinRequest}
              rejectGuest={conference.room.rejectGuestJoinRequest}
              handleLocalRecordingDrawerOpen={(open: boolean) =>
                conference.ui.handleLocalRecordingDrawerOpen?.(open)
              }
              handleTranscriptionDrawerOpen={(open: boolean) =>
                conference.ui.handleTranscriptionDrawerOpen?.(open)
              }
            />

            <InfoDrawer
              //@ts-ignore
              publishStreamId={conference.room.publishStreamIdRef?.current}
              infoDrawerOpen={conference.ui.infoDrawerOpen}
              handleInfoDrawerOpen={conference.ui.handleInfoDrawerOpen}
              handleMessageDrawerOpen={conference.ui.handleMessageDrawerOpen}
              handleParticipantListOpen={conference.ui.handleParticipantListOpen}
              handleEffectsOpen={conference.ui.handleEffectsOpen}
              handleLocalRecordingDrawerOpen={(open: boolean) =>
                conference.ui.handleLocalRecordingDrawerOpen?.(open)
              }
              handleTranscriptionDrawerOpen={(open: boolean) =>
                conference.ui.handleTranscriptionDrawerOpen?.(open)
              }
            />

            <EffectsDrawer
              effectsDrawerOpen={conference.ui.effectsDrawerOpen}
              setVirtualBackgroundImage={
                conference.features.virtualBackground.setVirtualBackgroundImage
              }
              handleBackgroundReplacement={
                conference.features.virtualBackground.handleBackgroundReplacement
              }
              handleInfoDrawerOpen={conference.ui.handleInfoDrawerOpen}
              handleMessageDrawerOpen={conference.ui.handleMessageDrawerOpen}
              handleParticipantListOpen={conference.ui.handleParticipantListOpen}
              handleEffectsOpen={conference.ui.handleEffectsOpen}
              handleLocalRecordingDrawerOpen={(open: boolean) =>
                conference.ui.handleLocalRecordingDrawerOpen?.(open)
              }
              handleTranscriptionDrawerOpen={(open: boolean) =>
                conference.ui.handleTranscriptionDrawerOpen?.(open)
              }
            />

            <LocalRecordingDrawer
              open={conference.ui.localRecordingDrawerOpen}
              onClose={conference.ui.handleLocalRecordingDrawerOpen}
              status={conference.features.localRecording.localRecordingStatus}
              startRecording={conference.features.localRecording.startLocalRecording}
              stopRecording={conference.features.localRecording.stopLocalRecording}
              pauseRecording={conference.features.localRecording.pauseLocalRecording}
              resumeRecording={conference.features.localRecording.resumeLocalRecording}
              isActive={conference.features.localRecording.isLocalRecordingActive}
              isPaused={conference.features.localRecording.isLocalRecordingPaused}
              onPause={conference.features.localRecording.pauseLocalRecording}
              onResume={conference.features.localRecording.resumeLocalRecording}
              onStart={conference.features.localRecording.startLocalRecording}
              onStop={conference.features.localRecording.stopLocalRecording}
              onDownload={conference.features.localRecording.downloadLocalRecording}
              onUpload={conference.features.localRecording.uploadLocalRecording}
              onClear={conference.features.localRecording.clearLocalRecording}
              isUploading={conference.features.localRecording.isUploading}
              uploadProgress={conference.features.localRecording.uploadProgress}
              uploadStatus={conference.features.localRecording.uploadStatus}
              uploadError={conference.features.localRecording.uploadError}
              hasS3Config={conference.features.localRecording.hasS3Config}
              recordingStartTime={conference.features.localRecording.recordingStartTime}
            />

            <ExternalStreamsDrawer
              open={conference.ui.externalStreamsDrawerOpen}
              onClose={conference.ui.handleExternalStreamsDrawerOpen}
              streams={conference.features.externalStreams.streams}
              participants={conference.participants.participants}
              fetchStreams={conference.features.externalStreams.fetchStreams}
              addToRoom={conference.features.externalStreams.addToRoom}
              removeFromRoom={conference.features.externalStreams.removeFromRoom}
              loading={conference.features.externalStreams.loading}
              error={conference.features.externalStreams.error}
            />
          </>
        )}
      </Grid>
    </Grid>
  );
}

export default Red5;
