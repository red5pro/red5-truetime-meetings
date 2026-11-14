import React, { JSX } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Heading, OptionTile, Spinner, Text, radii, themeColors } from 'truetime-ui';
import { SvgIcon } from './SvgIcon';
import { COLOR_OPTIONS } from '../constants/ColorBackgroundOptions';
import { getRuntimeConfig } from '../utils/configStore';

interface BackgroundReplacement {
  type: string;
  value?: string;
}

interface VirtualBackgroundImage {
  type: string;
  value: string;
}

type ApplyResult = Promise<boolean> | boolean | void;

interface EffectsTabProps {
  setVirtualBackgroundImage: (image: VirtualBackgroundImage) => ApplyResult;
  handleBackgroundReplacement: (replacement: BackgroundReplacement) => ApplyResult;
  /** The active mode from the virtual background hook: '' (none), 'blur', 'slight-blur', … */
  selectedBackgroundMode?: string;
  /** Effects work on the camera's frames, so they can't be applied while it's off. */
  isCameraOff?: boolean;
  /** Show a live preview of your video (off where a large preview is already on screen). */
  showPreview?: boolean;
}

/** One choice in the panel: its kind, plus the image URL or color for those kinds. */
interface Choice {
  type: string;
  value?: string;
}

const BLUR_OPTIONS = [
  { type: 'none', icon: 'remove-effect', label: 'No effect' },
  { type: 'slight-blur', icon: 'slight-blur', label: 'Slight blur' },
  { type: 'blur', icon: 'blur', label: 'Blur' },
] as const;

const PUBLISHER_VIDEO_ID = 'red5pro-publisher';

const sameChoice = (a: Choice | null, b: Choice) =>
  a !== null && a.type === b.type && (a.value ?? null) === (b.value ?? null);

/**
 * Your own video, mirrored like your tile, taken from the published video element so it shows the
 * effect as it's applied. The element's stream changes when the camera or an effect changes, so it
 * is checked again every second.
 */
function SelfPreview({ isCameraOff }: { isCameraOff?: boolean }) {
  const { t } = useTranslation();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (isCameraOff) return;
    const sync = () => {
      const source = document.getElementById(PUBLISHER_VIDEO_ID) as HTMLVideoElement | null;
      const stream = source?.srcObject ?? null;
      const video = videoRef.current;
      if (video && video.srcObject !== stream) {
        video.srcObject = stream;
        video.play().catch(() => {});
      }
    };
    sync();
    const timer = setInterval(sync, 1000);
    return () => clearInterval(timer);
  }, [isCameraOff]);

  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        aspectRatio: '16 / 9',
        borderRadius: `${radii.container}px`,
        overflow: 'hidden',
        backgroundColor: themeColors(theme).surface,
        display: 'grid',
        placeItems: 'center',
      })}
    >
      {isCameraOff ? (
        <Text tone="muted" variant="body2" sx={{ px: 3, textAlign: 'center' }}>
          {t('Turn on your camera to try backgrounds and effects')}
        </Text>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label={t('Your video preview')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />
      )}
    </Box>
  );
}

/** Covers a tile while its effect is being applied. */
function ApplyingOverlay() {
  return (
    <Box
      sx={(theme) => ({
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        backgroundColor: alpha(themeColors(theme).background, 0.55),
      })}
    >
      <Spinner size={20} />
    </Box>
  );
}

function Section({
  id,
  title,
  columns,
  children,
}: {
  id: string;
  title: string;
  columns: number;
  children: React.ReactNode;
}) {
  return (
    <Box component="section" aria-labelledby={id}>
      <Heading
        id={id}
        level={3}
        variant="subtitle2"
        sx={(theme) => ({ color: themeColors(theme).mutedText, mb: 1 })}
      >
        {title}
      </Heading>
      <Box
        role="group"
        aria-labelledby={id}
        sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 1 }}
      >
        {children}
      </Box>
    </Box>
  );
}

function EffectsTab({
  setVirtualBackgroundImage,
  handleBackgroundReplacement,
  selectedBackgroundMode = '',
  isCameraOff = false,
  showPreview = true,
}: EffectsTabProps): JSX.Element {
  const { t } = useTranslation();

  // The image or color last applied; the mode itself comes from the hook, so a failed or undone
  // change doesn't stay highlighted
  const [applied, setApplied] = React.useState<Choice | null>(null);
  const [pending, setPending] = React.useState<Choice | null>(null);

  const imageUrls = React.useMemo(
    () =>
      (getRuntimeConfig().VITE_VIRTUAL_BACKGROUND_IMAGES ?? '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean),
    [],
  );

  const isActive = (choice: Choice): boolean => {
    const mode = selectedBackgroundMode || 'none';
    if (choice.type !== mode) return false;
    if (choice.type === 'image' || choice.type === 'color') return sameChoice(applied, choice);
    return true;
  };

  const apply = async (choice: Choice) => {
    if (pending || isActive(choice)) return;
    setPending(choice);
    try {
      const result =
        choice.type === 'image'
          ? await setVirtualBackgroundImage({ type: 'image', value: choice.value! })
          : await handleBackgroundReplacement(choice);
      // The hook warns about failures itself; only remember choices that took effect
      if (result !== false) setApplied(choice);
    } finally {
      setPending(null);
    }
  };

  const tileProps = (choice: Choice, label: string) => ({
    label,
    selected: isActive(choice),
    disabled: isCameraOff || (pending !== null && !sameChoice(pending, choice)),
    'aria-busy': sameChoice(pending, choice) || undefined,
    onClick: () => apply(choice),
  });

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        pr: 0.5,
      }}
    >
      {showPreview && <SelfPreview isCameraOff={isCameraOff} />}
      {!showPreview && isCameraOff && (
        <Text tone="muted" variant="body2">
          {t('Turn on your camera to try backgrounds and effects')}
        </Text>
      )}

      <Section id="effects-blur-heading" title={t('Blur')} columns={3}>
        {BLUR_OPTIONS.map((option) => {
          const choice = { type: option.type };
          return (
            <OptionTile
              key={option.type}
              id={`effect-${option.type}`}
              {...tileProps(choice, t(option.label))}
              preview={
                <>
                  <Box sx={{ color: 'text.primary', display: 'grid' }}>
                    <SvgIcon
                      size={28}
                      viewBox="0 0 500 500"
                      name={option.icon}
                      color="currentColor"
                    />
                  </Box>
                  {sameChoice(pending, choice) && <ApplyingOverlay />}
                </>
              }
            />
          );
        })}
      </Section>

      {imageUrls.length > 0 && (
        <Section id="effects-images-heading" title={t('Backgrounds')} columns={3}>
          {imageUrls.map((url, index) => {
            const choice = { type: 'image', value: url };
            return (
              <OptionTile
                key={url}
                id={`effect-image-${index}`}
                {...tileProps(choice, `${t('Background')} ${index + 1}`)}
                preview={
                  <>
                    <img
                      src={url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {sameChoice(pending, choice) && <ApplyingOverlay />}
                  </>
                }
              />
            );
          })}
        </Section>
      )}

      <Section id="effects-colors-heading" title={t('Colors')} columns={3}>
        {COLOR_OPTIONS.map((option) => {
          const choice = { type: 'color', value: option.color };
          return (
            <OptionTile
              key={option.color}
              id={`effect-color-${option.color.slice(1)}`}
              {...tileProps(choice, t(option.name))}
              preview={
                <>
                  <Box sx={{ position: 'absolute', inset: 0, backgroundColor: option.color }} />
                  {sameChoice(pending, choice) && <ApplyingOverlay />}
                </>
              }
            />
          );
        })}
      </Section>
    </Box>
  );
}

export default React.memo(EffectsTab);
