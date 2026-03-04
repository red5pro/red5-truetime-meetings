import React, { ChangeEvent, JSX } from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { SvgIcon } from './SvgIcon';
import { useTheme, Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';
// @ts-expect-error: temporary fix for legacy code
import { CustomizedBtn } from './CustomizedBtn.tsx';
import { Box } from '@mui/system';
import log from 'loglevel';
import { COLOR_OPTIONS } from '../constants/ColorBackgroundOptions';
import { getRuntimeConfig } from '../utils/configStore';

// Types
interface SectionHeaderProps {
  title: string;
  icon?: string;
  theme: Theme;
}

interface EffectButtonProps {
  effectType: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
  theme: Theme;
}

interface ColorOption {
  color: string;
  name: string;
}

interface ColorButtonProps {
  color: string;
  name: string;
  isSelected: boolean;
  onClick: () => void;
  theme: Theme;
}

interface VirtualBackgroundButtonProps {
  imageSrc: string;
  imageName: string;
  index: number;
  showRemoveButton: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRemove?: () => void;
  theme: Theme;
  t: (key: string) => string;
}

interface BackgroundReplacement {
  type: string;
  value?: string;
}

interface VirtualBackgroundImage {
  type: string;
  value: string;
}

interface EffectsTabProps {
  setVirtualBackgroundImage: (image: VirtualBackgroundImage) => void;
  handleBackgroundReplacement: (replacement: BackgroundReplacement) => void;
}

// Global image cache to persist across renders
const globalImageCache = new Map<string, boolean>();
const imageLoadPromises = new Map<string, Promise<void>>();

// Memoized section header component
const SectionHeader = React.memo<SectionHeaderProps>(({ title, icon, theme }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    {icon && (
      <SvgIcon size={20} viewBox="0 0 500 500" name={icon} color={theme.palette.text.primary} />
    )}
    <Typography
      variant="subtitle1"
      sx={{
        ml: icon ? 1 : 0,
        fontWeight: 600,
        color: theme.palette.text.primary,
      }}
    >
      {title}
    </Typography>
  </Box>
));

// Memoized effect button component
const EffectButton = React.memo<EffectButtonProps>(({ icon, isSelected, onClick, theme }) => {
  const buttonStyle = React.useMemo(
    () => ({
      marginRight: 10,
      marginBottom: 10,
      transition: 'all 0.2s ease-in-out',
      willChange: 'transform, border, background',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
      transform: `${isSelected ? 'scale(1.05)' : 'scale(1)'} translateZ(0)`,
      WebkitTransform: `${isSelected ? 'scale(1.05)' : 'scale(1)'} translateZ(0)`,
      background: isSelected ? theme.palette.primary.main : theme.palette.themeColor?.[60],
      border: isSelected ? `2px solid ${theme.palette.primary.light}` : 'none',
    }),
    [isSelected, theme.palette.primary.main, theme.palette.primary.light, theme.palette.themeColor],
  );

  return (
    <CustomizedBtn style={buttonStyle} onClick={onClick}>
      <SvgIcon size={24} viewBox="0 0 500 500" name={icon} color="#fff" />
    </CustomizedBtn>
  );
});

// Memoized color button component
const ColorButton = React.memo<ColorButtonProps>(({ color, name, isSelected, onClick, theme }) => {
  const buttonStyle = React.useMemo(
    () => ({
      background: color,
      marginRight: 10,
      marginBottom: 10,
      width: 50,
      height: 50,
      minWidth: 50,
      borderRadius: '12px',
      position: 'relative' as const,
      overflow: 'visible' as const,
      transition: 'all 0.2s ease-in-out',
      willChange: 'transform, border',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
      transform: `${isSelected ? 'scale(1.1)' : 'scale(1)'} translateZ(0)`,
      WebkitTransform: `${isSelected ? 'scale(1.1)' : 'scale(1)'} translateZ(0)`,
      border: `${isSelected ? '3px' : '2px'} solid ${isSelected ? theme.palette.primary.light : 'rgba(255,255,255,0.2)'}`,
    }),
    [color, isSelected, theme.palette.primary.light],
  );

  const checkmarkStyle = React.useMemo(
    () => ({
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'bold',
      textShadow: '0 0 4px rgba(0,0,0,0.8)',
      willChange: 'transform',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
    }),
    [],
  );

  return (
    <CustomizedBtn style={buttonStyle} onClick={onClick} title={name}>
      {isSelected && <Box sx={checkmarkStyle}>✓</Box>}
    </CustomizedBtn>
  );
});

// Enhanced virtual background button with proper image caching
const VirtualBackgroundButton = React.memo<VirtualBackgroundButtonProps>(
  ({ imageSrc, index, showRemoveButton, isSelected, onSelect, onRemove, theme }) => {
    const [imageLoaded, setImageLoaded] = React.useState<boolean>(() => {
      // Check if already cached
      return globalImageCache.has(imageSrc);
    });
    const [imageError, setImageError] = React.useState<boolean>(false);

    // Use a stable reference for the image element
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
      // If already cached, we're done
      if (globalImageCache.has(imageSrc)) {
        setImageLoaded(true);
        return;
      }

      // Check if already loading
      if (imageLoadPromises.has(imageSrc)) {
        imageLoadPromises
          .get(imageSrc)
          ?.then(() => setImageLoaded(true))
          .catch(() => setImageError(true));
        return;
      }

      // Create new load promise
      const loadPromise = new Promise<void>((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          globalImageCache.set(imageSrc, true);
          setImageLoaded(true);
          setImageError(false);
          resolve();
        };

        img.onerror = () => {
          setImageError(true);
          setImageLoaded(false);
          reject();
        };

        // DO NOT add cache-busting parameters
        // Use the original URL to leverage browser cache
        img.src = imageSrc;
      });

      imageLoadPromises.set(imageSrc, loadPromise);

      return () => {
        // Cleanup if needed
      };
    }, [imageSrc]);

    const buttonStyle = React.useMemo(
      () => ({
        background: theme.palette.themeColor?.[60],
        marginRight: 10,
        marginBottom: 10,
        position: 'relative' as const,
        border: isSelected ? `2px solid ${theme.palette.primary.light}` : 'none',
        transform: `${isSelected ? 'scale(1.05)' : 'scale(1)'} translateZ(0)`,
        WebkitTransform: `${isSelected ? 'scale(1.05)' : 'scale(1)'} translateZ(0)`,
        transition: 'all 0.2s ease-in-out',
        willChange: 'transform, border',
        backfaceVisibility: 'hidden' as const,
        WebkitBackfaceVisibility: 'hidden' as const,
      }),
      [theme.palette.themeColor, theme.palette.primary.light, isSelected],
    );

    const removeButtonStyle = React.useMemo(
      () => ({
        position: 'absolute' as const,
        top: -5,
        right: -5,
        width: 20,
        height: 20,
        fontSize: '12px',
        padding: 0,
        border: 'none',
        borderRadius: '50%',
        backgroundColor: '#f44336',
        color: 'white',
        cursor: 'pointer' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        willChange: 'transform',
        backfaceVisibility: 'hidden' as const,
        WebkitBackfaceVisibility: 'hidden' as const,
      }),
      [],
    );

    const imageStyle = React.useMemo(
      () => ({
        borderRadius: '4px',
        opacity: imageLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        willChange: 'opacity',
        backfaceVisibility: 'hidden' as const,
        WebkitBackfaceVisibility: 'hidden' as const,
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        // Prevent layout shift
        width: 40,
        height: 40,
        objectFit: 'cover' as const,
      }),
      [imageLoaded],
    );

    return (
      <Grid>
        <CustomizedBtn style={buttonStyle} id="custom-virtual-background-button" onClick={onSelect}>
          {!imageError && (
            <img
              ref={imgRef}
              width={40}
              height={40}
              src={imageSrc}
              alt={`virtual background image ${index}`}
              style={imageStyle}
              loading="eager"
              decoding="async"
              onLoad={() => {
                if (!globalImageCache.has(imageSrc)) {
                  globalImageCache.set(imageSrc, true);
                }
                setImageLoaded(true);
                setImageError(false);
              }}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          )}
          {imageError && (
            <Box
              sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px',
              }}
            >
              Error
            </Box>
          )}
          {showRemoveButton && onRemove && (
            <button style={removeButtonStyle} onClick={onRemove}>
              ×
            </button>
          )}
        </CustomizedBtn>
      </Grid>
    );
  },
);

function EffectsTab({
  setVirtualBackgroundImage,
  handleBackgroundReplacement,
}: EffectsTabProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedEffect, setSelectedEffect] = React.useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = React.useState<string | null>(null);

  // Memoize virtual background images
  const virtualBackgroundImageData = React.useMemo(() => {
    if (
      getRuntimeConfig().VITE_VIRTUAL_BACKGROUND_IMAGES !== undefined &&
      getRuntimeConfig().VITE_VIRTUAL_BACKGROUND_IMAGES !== null
    ) {
      return getRuntimeConfig().VITE_VIRTUAL_BACKGROUND_IMAGES.split(',');
    }
    return [];
  }, []);

  const saveImageToFileSystem = React.useCallback(
    async (selectedFile: File, directoryHandle: any): Promise<void> => {
      log.log('Saving image to file system', selectedFile, directoryHandle);
    },
    [],
  );

  // Stable callbacks using useCallback instead of refs
  const handleEffectSelection = React.useCallback(
    (effectType: string) => {
      setSelectedEffect(effectType);
      setSelectedBackground(null);
      handleBackgroundReplacement({ type: effectType });
    },
    [handleBackgroundReplacement],
  );

  const handleBackgroundSelection = React.useCallback(
    (imageSrc: string, type: string = 'image') => {
      setSelectedBackground(imageSrc);
      setSelectedEffect(null);
      if (type === 'color') {
        handleBackgroundReplacement({ type: 'color', value: imageSrc });
      } else {
        setVirtualBackgroundImage({ type: 'image', value: imageSrc });
      }
    },
    [handleBackgroundReplacement, setVirtualBackgroundImage],
  );

  const handleFileChange = React.useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];

      if (typeof selectedFile !== 'undefined' && selectedFile !== null) {
        const processFile = () => {
          (navigator.storage as any).getDirectory().then((directoryHandle: any) => {
            saveImageToFileSystem(selectedFile, directoryHandle).then(() => {
              log.log('Image saved to file system');
            });
          });
        };

        if ((window as any).requestIdleCallback) {
          (window as any).requestIdleCallback(processFile);
        } else {
          setTimeout(processFile, 0);
        }
      }
    },
    [saveImageToFileSystem],
  );

  // Pre-create callbacks for backgrounds to prevent recreation
  const backgroundCallbacks = React.useMemo(() => {
    const callbacks = new Map<string, () => void>();
    virtualBackgroundImageData.forEach((imageSrc: string) => {
      callbacks.set(imageSrc, () => handleBackgroundSelection(imageSrc, 'image'));
    });
    return callbacks;
  }, [virtualBackgroundImageData, handleBackgroundSelection]);

  const colorCallbacks = React.useMemo(() => {
    const callbacks = new Map<string, () => void>();
    COLOR_OPTIONS.forEach((colorOption: ColorOption) => {
      callbacks.set(colorOption.color, () => handleBackgroundSelection(colorOption.color, 'color'));
    });
    return callbacks;
  }, [handleBackgroundSelection]);

  // Memoize section titles
  const effectsTitle = React.useMemo(() => t('Effects & Blur'), [t]);
  const imageBackgroundsTitle = React.useMemo(() => t('Image Backgrounds'), [t]);
  const colorBackgroundsTitle = React.useMemo(() => t('Color Backgrounds'), [t]);

  return (
    <Box
      sx={{
        width: '100%',
        overflowY: 'auto',
        p: 2,
        willChange: 'scroll-position',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <Stack spacing={3}>
        {/* Effects Section */}
        <Box>
          <SectionHeader title={effectsTitle} theme={theme} />
          <Grid container spacing={1}>
            <Grid>
              <EffectButton
                effectType="none"
                icon="remove-effect"
                isSelected={selectedEffect === 'none'}
                onClick={() => handleEffectSelection('none')}
                theme={theme}
              />
            </Grid>
            <Grid>
              <EffectButton
                effectType="slight-blur"
                icon="slight-blur"
                isSelected={selectedEffect === 'slight-blur'}
                onClick={() => handleEffectSelection('slight-blur')}
                theme={theme}
              />
            </Grid>
            <Grid>
              <EffectButton
                effectType="blur"
                icon="blur"
                isSelected={selectedEffect === 'blur'}
                onClick={() => handleEffectSelection('blur')}
                theme={theme}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Image Backgrounds Section */}
        <Box>
          <SectionHeader title={imageBackgroundsTitle} theme={theme} />
          <input
            type="file"
            accept=".jpg, .jpeg, .png"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            id="imageInput"
          />
          <Grid container spacing={1}>
            {virtualBackgroundImageData.map((imageSrc: string, index: number) => (
              <VirtualBackgroundButton
                key={`bg-${index}`} // Use stable index-based key
                imageSrc={imageSrc}
                imageName={`image${index}`}
                index={index}
                showRemoveButton={false}
                isSelected={selectedBackground === imageSrc}
                onSelect={backgroundCallbacks.get(imageSrc)!}
                theme={theme}
                t={t}
              />
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Color Backgrounds Section */}
        <Box>
          <SectionHeader title={colorBackgroundsTitle} theme={theme} />
          <Grid container spacing={1}>
            {COLOR_OPTIONS.map((colorOption: ColorOption, index: number) => (
              <Grid key={`color-${index}`}>
                <ColorButton
                  color={colorOption.color}
                  name={colorOption.name}
                  isSelected={selectedBackground === colorOption.color}
                  onClick={colorCallbacks.get(colorOption.color)!}
                  theme={theme}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Stack>
    </Box>
  );
}

// Set display names for debugging
SectionHeader.displayName = 'SectionHeader';
EffectButton.displayName = 'EffectButton';
ColorButton.displayName = 'ColorButton';
VirtualBackgroundButton.displayName = 'VirtualBackgroundButton';

export default React.memo(EffectsTab);
