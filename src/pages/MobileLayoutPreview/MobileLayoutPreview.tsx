import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { Select } from 'truetime-ui';

import LayoutMobile from '../Layout/MobileLayout.tsx';
import { ParticipantObject } from '../Layout/types.ts';
import Footer from '../../Components/Footer/Footer.tsx';
import { LayoutOptions } from '../../utils/layoutOptions.ts';

// Dev-only route (see CustomRoutes.tsx) for eyeballing LayoutMobile's scenarios
// (Auto / Tiled / pinned, any participant count, several phone sizes) without a
// live meeting. The fit check below flags any tile that is cut off vertically.
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

// Common phone viewports; the frame height is the visible area minus the 80px footer.
const PHONE_SIZES = [
  { value: '375x667', label: 'iPhone SE (375×667)' },
  { value: '390x844', label: 'iPhone 14 (390×844)' },
  { value: '430x932', label: 'iPhone 15 Pro Max (430×932)' },
  { value: '360x640', label: 'Small Android (360×640)' },
  { value: '412x915', label: 'Pixel 7 (412×915)' },
];
const FOOTER_HEIGHT = 80;
const NO_PIN = 'none';

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
  // Initial state can come from the URL, e.g. ?remotes=8&layout=tiled&pin=preview-remote-0&size=375x667
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const [remoteCount, setRemoteCount] = useState(() =>
    Math.min(Number(params.get('remotes') ?? 1) || 0, MAX_REMOTES),
  );
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [layout, setLayout] = useState<string>(params.get('layout') ?? LayoutOptions.Auto);
  const [pinnedUid, setPinnedUid] = useState<string>(params.get('pin') ?? NO_PIN);
  const [phoneSize, setPhoneSize] = useState(
    PHONE_SIZES.find((size) => size.value === params.get('size'))?.value ?? PHONE_SIZES[1].value,
  );
  const [cutOffCount, setCutOffCount] = useState(0);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  const [frameWidth, frameHeight] = phoneSize.split('x').map(Number);

  const allParticipants = useMemo<ParticipantObject[]>(() => {
    const local = makeParticipant(LOCAL_UID, 'You', true);
    const remotes = Array.from({ length: remoteCount }, (_, i) =>
      makeParticipant(`preview-remote-${i}`, REMOTE_NAMES[i % REMOTE_NAMES.length], i % 3 !== 0),
    );
    return [local, ...remotes];
  }, [remoteCount]);

  const pinnedParticipantId = allParticipants.some((p) => p.participant.uid === pinnedUid)
    ? pinnedUid
    : null;

  // Count visible tiles that extend above or below the gallery (i.e. would need scrolling).
  useLayoutEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const { top, bottom } = gallery.getBoundingClientRect();
    const tiles = gallery.querySelectorAll('.single-video-container:not(.audio-only-participant)');
    const cutOff = Array.from(tiles).filter((tile) => {
      const rect = tile.getBoundingClientRect();
      return rect.top < top - 1 || rect.bottom > bottom + 1;
    }).length;
    queueMicrotask(() => setCutOffCount(cutOff));
  }, [allParticipants, layout, pinnedParticipantId, phoneSize]);

  const scenarioLabel = pinnedParticipantId
    ? 'pinned — pinned tile on top, the rest in a horizontal strip'
    : layout === LayoutOptions.Tiled
      ? remoteCount === 0
        ? SCENARIO_LABEL[0]
        : gridScenarioLabel(remoteCount)
      : (SCENARIO_LABEL[remoteCount] ?? gridScenarioLabel(remoteCount));

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
          {remoteCount} remote participant{remoteCount === 1 ? '' : 's'} — {scenarioLabel}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        <Select
          aria-label="Layout"
          value={layout}
          onChange={setLayout}
          options={[
            { value: LayoutOptions.Auto, label: 'Auto' },
            { value: LayoutOptions.Tiled, label: 'Tiled' },
          ]}
        />
        <Select
          aria-label="Pinned participant"
          value={pinnedParticipantId ?? NO_PIN}
          onChange={setPinnedUid}
          options={[
            { value: NO_PIN, label: 'No pin' },
            ...allParticipants.map((p) => ({
              value: p.participant.uid,
              label: `Pin ${p.participant.name}`,
            })),
          ]}
        />
        <Select
          aria-label="Phone size"
          value={phoneSize}
          onChange={setPhoneSize}
          options={PHONE_SIZES}
        />
      </Box>

      <Typography
        variant="body2"
        role="status"
        color={cutOffCount === 0 ? 'success.main' : 'error.main'}
      >
        {cutOffCount === 0
          ? 'Fits: every tile is fully visible without vertical scrolling'
          : `${cutOffCount} tile${cutOffCount === 1 ? ' is' : 's are'} cut off vertically`}
      </Typography>

      <Box
        sx={{
          width: frameWidth,
          height: frameHeight - FOOTER_HEIGHT,
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
          ref={galleryRef}
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
            pinnedParticipantId={pinnedParticipantId}
            pinVideo={setPinnedUid}
            unpinVideo={() => setPinnedUid(NO_PIN)}
            layout={layout}
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
        layout={layout}
        setLeftTheRoom={() => {}}
      />
    </Box>
  );
};

export default MobileLayoutPreview;
