import React, { useMemo, useState } from 'react';
import { Box, Slider, Typography } from '@mui/material';

import LayoutMobile from '../Layout/MobileLayout.tsx';
import { ParticipantObject } from '../Layout/types.ts';
import Footer from '../../Components/Footer/Footer.tsx';

// Dev-only route (see CustomRoutes.tsx) for eyeballing LayoutMobile's three
// scenarios (solo / 1 remote / 2 remotes / 3+ remotes) without a live meeting.
const MAX_REMOTES = 15;
const LOCAL_UID = 'preview-local';

const REMOTE_NAMES = [
  'Ava Thompson',
  'Miguel Santos',
  'Priya Natarajan',
  'Chen Wei',
  'Sara Blake',
  'Noah Kim',
  'Lena Ortiz',
  'Diego Alvarez',
  'Yuki Tanaka',
  'Fatima Haidari',
  'Owen Brennan',
  'Marta Kowalski',
  'Elias Bergman',
  'Nadia Farouk',
  'Tobias Reinholt',
];

const SCENARIO_LABEL: Record<number, string> = {
  0: 'Solo — local fills the screen',
  1: '1 remote — remote full-screen, local floats as a PIP',
  2: '2 remotes — stacked, local PIP nested in the 2nd tile',
};

const gridScenarioLabel = (remoteCount: number): string =>
  remoteCount > 7
    ? `grid layout — 6 visible + "${remoteCount - 6} Others" tile bottom-right`
    : 'grid layout';

const makeParticipant = (uid: string, name: string, audioEnabled: boolean): ParticipantObject => ({
  mediaStream: null,
  participant: {
    uid,
    name,
    audioEnabled,
    videoEnabled: false,
    isPending: false,
    isRaiseHand: false,
  },
});

const MobileLayoutPreview: React.FC = () => {
  const [remoteCount, setRemoteCount] = useState(1);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);

  const allParticipants = useMemo<ParticipantObject[]>(() => {
    const local = makeParticipant(LOCAL_UID, 'You', true);
    const remotes = Array.from({ length: remoteCount }, (_, i) =>
      makeParticipant(`preview-remote-${i}`, REMOTE_NAMES[i % REMOTE_NAMES.length], i % 3 !== 0),
    );
    return [local, ...remotes];
  }, [remoteCount]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0d0d0d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        py: 5,
        px: 2,
        pb: '96px', // reserve space so the fixed Footer below doesn't cover the frame
      }}
    >
      <Typography variant="h5" color="white">
        Mobile Layout Preview
      </Typography>
      <Typography variant="body2" color="rgba(255,255,255,0.6)" textAlign="center" maxWidth={420}>
        Dev-only preview of LayoutMobile with mock participants — no meeting/backend connection
        required. The bar below is the real Footer; note its own mobile/compact mode is driven by
        the actual browser window width (≤1000px), independent of the phone frame's fixed size —
        shrink the browser window to see it collapse the way it does on a real phone.
      </Typography>

      <Box sx={{ width: 320 }}>
        <Slider
          value={remoteCount}
          onChange={(_, v) => setRemoteCount(v as number)}
          min={0}
          max={MAX_REMOTES}
          step={1}
          marks
          valueLabelDisplay="on"
        />
        <Typography variant="body2" color="white" textAlign="center">
          {remoteCount} remote participant{remoteCount === 1 ? '' : 's'} —{' '}
          {SCENARIO_LABEL[remoteCount] ?? gridScenarioLabel(remoteCount)}
        </Typography>
      </Box>

      <Box
        sx={{
          width: 390,
          height: 780,
          borderRadius: '44px',
          border: '10px solid #2a2a2a',
          overflow: 'hidden',
          position: 'relative',
          bgcolor: '#000',
          boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
          flexShrink: 0,
        }}
      >
        {/* Reuses the real #stream-gallery id so LayoutMobile renders inside the
            exact same CSS context it gets in production; only position/size are
            pinned to the phone frame instead of the real viewport. */}
        <Box
          id="stream-gallery"
          sx={{
            position: 'relative !important',
            top: 'unset !important',
            left: 'unset !important',
            width: '100% !important',
            height: '100% !important',
          }}
        >
          <LayoutMobile
            allParticipants={allParticipants}
            streamName={LOCAL_UID}
            isPlayOnly={false}
            pinVideo={() => {}}
            unpinVideo={() => {}}
            layout="tiled"
            globals={{}}
            connectionStats={{}}
            networkScore={{ outbound: 4 }}
            setParticipantIdMuted={() => {}}
            setMuteParticipantDialogOpen={() => {}}
          />
        </Box>
      </Box>

      <Footer
        updateDevicesList={() => {}}
        isPlayOnly={false}
        isMyMicMuted={isMicMuted}
        toggleMic={() => setIsMicMuted((prev) => !prev)}
        isMyCamTurnedOff={isCamOff}
        checkAndTurnOffLocalCamera={() => setIsCamOff(true)}
        checkAndTurnOnLocalCamera={() => setIsCamOff(false)}
        isScreenShared={isScreenShared}
        handleStartScreenShare={() => setIsScreenShared(true)}
        handleStopScreenShare={() => setIsScreenShared(false)}
        participantCount={allParticipants.length}
        layout="tiled"
        setLeftTheRoom={() => {}}
      />
    </Box>
  );
};

export default MobileLayoutPreview;
