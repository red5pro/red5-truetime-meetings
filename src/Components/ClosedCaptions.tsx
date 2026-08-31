import React, { useState, useRef, useEffect, MouseEvent, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Popover,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Paper,
  SelectChangeEvent,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Settings,
  Language,
  FormatSize,
  Palette,
  ClosedCaption,
  Translate,
} from '@mui/icons-material';
import { useTheme, styled, Theme } from '@mui/material/styles';

// Interfaces
interface Caption {
  id: number;
  text: string;
  timestamp: Date;
  speaker: string;
  isCurrent: boolean;
}

interface Language {
  code: string;
  name: string;
}

interface Dictionary<T> {
  [Key: string]: T;
}

interface ClosedCaptionsProps {
  isVisible?: boolean;
  captions?: Caption[];
  onToggleVisibility?: () => void;
  onLanguageChange?: (language: string) => void;
  onCaptionTypeChange?: (isLive: boolean) => void;
  selectedLanguage?: string;
  isLiveCaptions?: boolean;
  subscribedParticipants?: Dictionary<string>;
}

interface CaptionTextProps {
  fontsize: number;
  fontcolor: string;
}

// Styled components
const CaptionsContainer = styled(Box)(({ theme }: { theme: Theme }) => ({
  position: 'fixed',
  bottom: 80, // Footer height
  left: 0,
  width: '100%',
  height: 240, // 3x footer height (80px * 3)
  backgroundColor: theme.palette.themeColor?.[80] || 'rgba(0, 0, 0, 0.8)',
  borderTop: `1px solid ${theme.palette.divider}`,
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('sm')]: {
    bottom: 72,
    height: 180,
  },
}));

const CaptionsHeader = styled(Box)(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  backgroundColor: theme.palette.themeColor?.[70] || 'rgba(0, 0, 0, 0.9)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 48,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    padding: '8px 12px',
  },
}));

const CaptionsContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.1)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(255, 255, 255, 0.5)',
  },
});

const CaptionText = styled(Typography)<CaptionTextProps>(({ fontsize, fontcolor }) => ({
  fontSize: `${fontsize}px`,
  color: fontcolor,
  lineHeight: 1.5,
  marginBottom: '8px',
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
  '&.current': {
    fontWeight: 'bold',
  },
}));

// Language options
const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  /*,
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'tr', name: 'Turkish' }
     */
];

// Color options
const COLORS: string[] = [
  '#FFFFFF',
  '#000000',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#FFA500',
  '#800080',
];

const ClosedCaptions: React.FC<ClosedCaptionsProps> = ({
  isVisible = true,
  captions = [],
  onLanguageChange,
  onCaptionTypeChange,
  selectedLanguage = 'en',
  isLiveCaptions = true,
  subscribedParticipants = {},
}) => {
  const theme = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  // Settings state
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontColor, setFontColor] = useState<string>('#FFFFFF');
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null);

  const displayCaptions = captions.length > 0 ? captions : [];

  // Auto-scroll to bottom when new captions arrive
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayCaptions]);

  const handleSettingsClick = (event: MouseEvent<HTMLButtonElement>): void => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = (): void => {
    setSettingsAnchor(null);
  };

  const handleColorPickerClick = (event: MouseEvent<HTMLButtonElement>): void => {
    setColorPickerAnchor(event.currentTarget);
  };

  const handleColorPickerClose = (): void => {
    setColorPickerAnchor(null);
  };

  const handleLanguageSelect = (event: SelectChangeEvent<string>): void => {
    const newLanguage = event.target.value;
    onLanguageChange?.(newLanguage);
  };

  const handleCaptionTypeToggle = (event: ChangeEvent<HTMLInputElement>): void => {
    const newType = event.target.checked;
    onCaptionTypeChange?.(newType);
  };

  const handleFontSizeChange = (_: Event, value: number | number[]): void => {
    setFontSize(Array.isArray(value) ? value[0] : value);
  };

  const handleColorSelect = (color: string): void => {
    setFontColor(color);
    handleColorPickerClose();
  };

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isVisible) return null;

  return (
    <CaptionsContainer>
      <CaptionsHeader>
        <Box display="flex" alignItems="center" gap={2}>
          <ClosedCaption sx={{ color: theme.palette.text.primary }} />
          <Typography variant="h6" color={theme.palette.text.primary}>
            Closed Captions
          </Typography>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' },
          }}
        >
          {/* Language Selector */}
          <FormControl size="small" variant="outlined">
            <Select
              value={selectedLanguage}
              onChange={handleLanguageSelect}
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
                '& .MuiSvgIcon-root': {
                  color: theme.palette.text.primary,
                },
                minWidth: { xs: 96, sm: 120 },
              }}
              startAdornment={<Language sx={{ mr: 1, fontSize: 20 }} />}
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Caption Type Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={isLiveCaptions}
                onChange={handleCaptionTypeToggle}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: theme.palette.primary.main,
                  },
                }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                {isLiveCaptions ? (
                  <ClosedCaption fontSize="small" />
                ) : (
                  <Translate fontSize="small" />
                )}
                <Typography variant="body2" color={theme.palette.text.primary}>
                  {isLiveCaptions ? 'Live' : 'Translated'}
                </Typography>
              </Box>
            }
            sx={{ margin: 0 }}
          />

          {/* Settings Button */}
          <IconButton
            onClick={handleSettingsClick}
            size="small"
            sx={{ color: theme.palette.text.primary }}
          >
            <Settings />
          </IconButton>
        </Box>
      </CaptionsHeader>

      <CaptionsContent ref={contentRef}>
        {displayCaptions.map((caption) => (
          <Box key={caption.id} mb={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, opacity: 0.7 }}
              >
                {formatTime(caption.timestamp)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 'medium',
                }}
              >
                {subscribedParticipants[caption.speaker]?.participant?.name ?? 'You'}:
              </Typography>
            </Box>
            <CaptionText
              fontsize={fontSize}
              fontcolor={fontColor}
              className={caption.isCurrent ? 'current' : ''}
            >
              {caption.text}
            </CaptionText>
          </Box>
        ))}
      </CaptionsContent>

      {/* Settings Popover */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={handleSettingsClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ p: 3, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            Caption Settings
          </Typography>

          <Grid container spacing={3}>
            {/* Font Size */}
            <Grid size={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <FormatSize />
                <Typography variant="body2" sx={{ minWidth: 80 }}>
                  Font Size
                </Typography>
                <Slider
                  value={fontSize}
                  onChange={handleFontSizeChange}
                  min={12}
                  max={24}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ flex: 1 }}
                />
              </Box>
            </Grid>

            {/* Font Color */}
            <Grid size={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Palette />
                <Typography variant="body2">Text Color</Typography>
                <Button
                  onClick={handleColorPickerClick}
                  variant="outlined"
                  size="small"
                  sx={{
                    backgroundColor: fontColor,
                    minWidth: 40,
                    height: 30,
                    border: '2px solid #ccc',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Popover>

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select Color
          </Typography>
          <Grid container spacing={1} sx={{ maxWidth: 200 }}>
            {COLORS.map((color) => (
              <Grid size={2.4} key={color}>
                <Button
                  onClick={() => handleColorSelect(color)}
                  sx={{
                    backgroundColor: color,
                    minWidth: 30,
                    height: 30,
                    border: fontColor === color ? '2px solid #000' : '1px solid #ccc',
                    '&:hover': {
                      backgroundColor: color,
                      opacity: 0.8,
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Popover>
    </CaptionsContainer>
  );
};

export default ClosedCaptions;
