import React, { useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { Container, Typography, SelectChangeEvent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import log from 'loglevel';

import SettingsDialog from '../../Components/Footer/Components/SettingsDialog.tsx';
import { SvgIcon } from '../../Components/SvgIcon.tsx';
import { getUrlParameter, makeId } from '../../utils/utils.tsx';
import { useRoomInfo } from '../../hooks/useRoomInfo.ts';
import DeviceSelector from '../../Components/DeviceSelector.tsx';
import EffectsDrawer from '../../Components/EffectsDrawer.tsx';
import { LobbyPageProps } from './types.ts';
import { JoinForm } from './components/JoinForm.tsx';
import { PlayOnlyVideoCard } from './components/PlayOnlyVideoCard.tsx';
import { VideoPreview } from './components/VideoPreview.tsx';
import { ControlButtons } from './components/ControlButtons.tsx';
import { UserRole } from '../../constants/userRoles.ts';

// Utility functions
const getPublishStreamId = (): string | boolean | undefined => {
  return getUrlParameter('streamId');
};

const generateStreamId = (streamName: string): string => {
  return streamName.replace(/[\W_]/g, '') + '_' + makeId(6);
};

const LobbyPage = React.memo<LobbyPageProps>((props) => {
  const {
    outgoingBitrate,
    updateOutgoingBitrate,
    streamName,
    setStreamName,
    isPlayOnly,
    cameraPermissionState,
    microphonePermissionState,
    setIsJoining,
    setIsWaitingApproval,
    joinRoom,
    devices,
    glass,
    isMyCamTurnedOff,
    cameraButtonDisabled,
    handleMuteVideoLobby,
    isMyMicMuted,
    toggleMic,
    microphoneButtonDisabled,
    handleBackgroundReplacement,
    microphoneSelected,
    selectedSpeaker,
    speakerSelected,
    selectedCamera,
    cameraSelected,
    selectedMicrophone,
    selectedBackgroundMode,
    setSelectedBackgroundMode,
    publishStreamId,
    talkers,
    isPublished,
    pinVideo,
    unpinVideo,
    layout,
    isJoining = false,
    role,
    setRole,
    handleEffectsOpen,
    effectsDrawerOpen,
    setVirtualBackgroundImage,
    handleInfoDrawerOpen,
    handleMessageDrawerOpen,
    handleParticipantListOpen,
  } = props;

  const { id: roomId } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectFocus, setSelectFocus] = useState<string | null>(null);
  const [streamNameFieldError, setStreamNameFieldError] = useState(false);

  // Memoized values
  const roomName = roomId;
  const currentPublishStreamId = useMemo(() => getPublishStreamId(), []);

  const { roomInfo } = useRoomInfo(roomName ?? '', 5000);

  // Permission check
  const hasRequiredPermissions = useMemo(() => {
    if (isPlayOnly) return true;
    return cameraPermissionState === 'granted' && microphonePermissionState === 'granted';
  }, [isPlayOnly, cameraPermissionState, microphonePermissionState]);

  // Event handlers
  const showPermissionError = useCallback(() => {
    enqueueSnackbar(
      {
        // @ts-ignore
        message: t('You need to allow microphone and camera permissions before joining'),
        variant: 'info',
        icon: <SvgIcon size={24} viewBox="0 0 500 500" name="muted-microphone" color="#fff" />,
      },
      { autoHideDuration: 1500 },
    );
  }, [enqueueSnackbar, t]);

  const showDeviceError = useCallback(() => {
    enqueueSnackbar(
      {
        // @ts-ignore
        message: t('You need to allow microphone and camera permissions before changing settings'),
        variant: 'info',
        icon: <SvgIcon size={24} viewBox="0 0 500 500" name="muted-microphone" color="#fff" />,
      },
      { autoHideDuration: 1500 },
    );
  }, [enqueueSnackbar, t]);

  const handleJoinRoom = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!hasRequiredPermissions) {
        showPermissionError();
        return;
      }

      let streamId: string;
      if (!currentPublishStreamId) {
        streamId = generateStreamId(streamName);
        log.log('generatedStreamId:', streamId);
      } else {
        // @ts-ignore
        streamId = currentPublishStreamId;
      }

      setIsJoining(true);
      joinRoom(roomName!, streamId);
    },
    [
      hasRequiredPermissions,
      showPermissionError,
      currentPublishStreamId,
      streamName,
      setIsJoining,
      setIsWaitingApproval,
      joinRoom,
      roomName,
    ],
  );

  const handleStreamNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setStreamNameFieldError(value.trim().length === 0);
      setStreamName(value);
    },
    [setStreamName],
  );

  const handleRoleChange = useCallback(
    (e: SelectChangeEvent<UserRole>) => {
      setRole(e.target.value as UserRole);
    },
    [setRole],
  );

  const handleSettingsOpen = useCallback(
    (focus: string | null = null) => {
      if (devices.length === 0) {
        showDeviceError();
        return;
      }
      setSelectFocus(focus);
      setDialogOpen(true);
    },
    [devices.length, showDeviceError],
  );

  const handleSettingsClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  // Render content based on mode
  const renderContent = () => {
    if (isPlayOnly) {
      return (
        <>
          <Grid size={{ md: 7 }} sx={{ alignSelf: 'stretch' }}>
            <Typography variant="h4" align="center" sx={{ mb: 3 }}>
              {t('TrueTime Meeting by Red5')}
            </Typography>
            <Grid size={{ md: 12 }}>
              <JoinForm
                streamName={streamName}
                onStreamNameChange={handleStreamNameChange}
                streamNameFieldError={streamNameFieldError}
                selectedRole={role}
                onRoleChange={handleRoleChange}
                onSubmit={handleJoinRoom}
                isJoining={isJoining}
                // @ts-ignore
                roomInfo={roomInfo}
              />
            </Grid>
          </Grid>
          <PlayOnlyVideoCard
            streamName={streamName}
            isPublished={isPublished}
            isPlayOnly={isPlayOnly}
            isMyMicMuted={isMyMicMuted}
            isMyCamTurnedOff={isMyCamTurnedOff}
            publishStreamId={publishStreamId}
            pinVideo={pinVideo}
            unpinVideo={unpinVideo}
            layout={layout}
          />
        </>
      );
    }

    return (
      <Grid size={{ md: 7 }} sx={{ alignSelf: 'stretch' }}>
        <Typography variant="h4" align="center" sx={{ mb: 3 }}>
          {t('TrueTime Meeting by Red5')}
        </Typography>
        <Grid container className="lobby-page-video" sx={{ position: 'relative' }}>
          <VideoPreview
            publishStreamId={publishStreamId}
            talkers={talkers}
            streamName={streamName}
            isPublished={isPublished}
            isPlayOnly={isPlayOnly}
            isMyMicMuted={isMyMicMuted}
            isMyCamTurnedOff={isMyCamTurnedOff}
            pinVideo={pinVideo}
            unpinVideo={unpinVideo}
            layout={layout}
          />
          <ControlButtons
            glass={glass}
            isMyCamTurnedOff={isMyCamTurnedOff}
            cameraButtonDisabled={cameraButtonDisabled}
            handleMuteVideoLobby={handleMuteVideoLobby}
            isMyMicMuted={isMyMicMuted}
            toggleMic={toggleMic}
            microphoneButtonDisabled={microphoneButtonDisabled}
            onSettingsClick={() => handleSettingsOpen()}
            onVirtualEffectsClick={() => handleEffectsOpen(!effectsDrawerOpen)}
          />
        </Grid>
        <Grid size={{ md: 12 }}>
          <DeviceSelector
            //@ts-ignore
            devices={devices}
            selectedCamera={selectedCamera}
            selectedMicrophone={selectedMicrophone}
            selectedSpeaker={selectedSpeaker}
            onCameraChange={cameraSelected}
            onMicrophoneChange={microphoneSelected}
            onSpeakerChange={speakerSelected}
            isCameraOn={!isMyCamTurnedOff}
            isMicOn={!isMyMicMuted}
          />
        </Grid>
        <Grid size={{ md: 12 }}>
          <JoinForm
            streamName={streamName}
            onStreamNameChange={handleStreamNameChange}
            streamNameFieldError={streamNameFieldError}
            selectedRole={role}
            onRoleChange={handleRoleChange}
            onSubmit={handleJoinRoom}
            isJoining={isJoining}
            // @ts-ignore
            roomInfo={roomInfo}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Container
      id="lobby-page"
      maxWidth={false}
      sx={{ width: '100%', maxWidth: '100%', px: { xs: 2, sm: 3 } }}
    >
      <SettingsDialog
        open={dialogOpen}
        onClose={handleSettingsClose}
        //@ts-ignore
        selectFocus={selectFocus}
        handleBackgroundReplacement={handleBackgroundReplacement}
        microphoneSelected={microphoneSelected}
        selectedSpeaker={selectedSpeaker}
        speakerSelected={speakerSelected}
        //@ts-ignore
        devices={devices}
        selectedCamera={selectedCamera}
        cameraSelected={cameraSelected}
        selectedMicrophone={selectedMicrophone}
        selectedBackgroundMode={selectedBackgroundMode}
        setSelectedBackgroundMode={setSelectedBackgroundMode}
        //@ts-ignore
        outgoingBitrate={outgoingBitrate}
        //@ts-ignore
        updateOutgoingBitrate={updateOutgoingBitrate}
      />

      <Grid container spacing={4} justifyContent="center" alignItems="center">
        {renderContent()}
      </Grid>
      <EffectsDrawer
        effectsDrawerOpen={effectsDrawerOpen}
        setVirtualBackgroundImage={setVirtualBackgroundImage}
        //@ts-ignore
        handleBackgroundReplacement={handleBackgroundReplacement}
        handleInfoDrawerOpen={(open: boolean) => handleInfoDrawerOpen(open)}
        handleMessageDrawerOpen={handleMessageDrawerOpen}
        handleParticipantListOpen={handleParticipantListOpen}
        handleEffectsOpen={handleEffectsOpen}
      />
    </Container>
  );
});

LobbyPage.displayName = 'LobbyPage';

export default LobbyPage;
