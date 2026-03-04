import React, { MouseEvent, useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import {
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { Check } from '@mui/icons-material';
// @ts-ignore
import { CustomizedBtn, rectangularStyle } from '../../CustomizedBtn.tsx';
import { Box } from '@mui/system';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface Device {
  deviceId: string;
  label: string;
  kind: string;
}

interface CameraButtonProps {
  glass?: boolean;
  footer?: boolean;
  isCamTurnedOff?: boolean;
  cameraButtonDisabled?: boolean;
  onTurnOffCamera?: () => void;
  onTurnOnCamera?: () => void;
  rounded?: boolean;
  // New props for device selection
  videoInputs?: Device[];
  selectedCamera?: string;
  onCameraChange?: (deviceId: string) => void;
  showCameraOptions?: boolean; // Flag to show/hide dropdown button (default: true)
}

function CameraButton(props: CameraButtonProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [_, setHovered] = React.useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Default showCameraOptions to true if not specified
  const showCameraOptions = props.showCameraOptions !== false;

  // Initialize default camera selection
  useEffect(() => {
    if (!props.selectedCamera && props.videoInputs && props.videoInputs.length > 0) {
      props.onCameraChange?.(props.videoInputs[0].deviceId);
    }
  }, [props.videoInputs, props.selectedCamera, props.onCameraChange]);

  const handleCameraToggle = (e: MouseEvent<HTMLButtonElement>, isTurningOff: boolean) => {
    e.stopPropagation();

    const notificationContent = (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SvgIcon
          size={14}
          viewBox="0 0 500 500"
          name={isTurningOff ? 'camera-off' : 'camera'}
          color={theme.palette.themeColor[99]}
        />
        {isTurningOff ? t('Camera turned off') : t('Camera turned on')}
      </Box>
    );

    enqueueSnackbar(notificationContent, {
      variant: 'info',
      autoHideDuration: 1500,
    });

    if (isTurningOff) {
      props?.onTurnOffCamera?.();
    } else {
      props?.onTurnOnCamera?.();
    }
  };

  const handleMenuOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCameraSelect = (deviceId: string) => {
    props.onCameraChange?.(deviceId);
    handleMenuClose();
  };

  const getIconColor = (): string => {
    return theme.palette.themeColor[99];
  };

  const getButtonColor = (): 'primary' | 'secondary' | 'error' => {
    if (props?.cameraButtonDisabled) {
      return 'secondary';
    }
    return props?.isCamTurnedOff ? 'error' : 'secondary';
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.12 }}>
      {/* Main Camera Button */}
      <Tooltip
        title={t(props?.isCamTurnedOff ? 'Turn on camera' : 'Turn off camera')}
        placement="top"
      >
        <CustomizedBtn
          id="camera-button"
          glass={props?.glass}
          className={props?.footer ? 'footer-icon-button' : ''}
          variant="contained"
          color={getButtonColor()}
          sx={{
            ...rectangularStyle,
            // Only adjust border radius if dropdown is shown
            ...(showCameraOptions && {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }),
          }}
          disabled={props?.cameraButtonDisabled}
          onClick={(e: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) =>
            handleCameraToggle(e, !props?.isCamTurnedOff)
          }
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <SvgIcon
            size={24}
            viewBox="0 0 500 500"
            name={props?.isCamTurnedOff ? 'camera-off' : 'camera'}
            color={getIconColor()}
          />
        </CustomizedBtn>
      </Tooltip>

      {/* Dropdown Arrow Button - conditionally rendered */}
      {showCameraOptions && (
        <>
          <Tooltip title={t('Camera options')} placement="top">
            <CustomizedBtn
              id="camera-menu-button"
              glass={props?.glass}
              className={props?.footer ? 'footer-icon-button' : ''}
              variant="contained"
              color={getButtonColor()}
              sx={{
                ...rectangularStyle,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                minWidth: '32px',
                width: '32px',
                padding: '8px 4px',
              }}
              disabled={props?.cameraButtonDisabled}
              onClick={handleMenuOpen}
              aria-controls={open ? 'camera-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 20,
                  color: getIconColor(),
                  transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </CustomizedBtn>
          </Tooltip>

          {/* Popup Menu with Camera Device Selection */}
          <Menu
            id="camera-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': 'camera-menu-button',
            }}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: {
                minWidth: 250,
                maxWidth: 400,
              },
            }}
          >
            {/* Camera Selection Section */}
            <Typography
              variant="subtitle2"
              sx={{
                px: 2,
                py: 1,
                color: theme.palette.text.secondary,
                fontWeight: 600,
              }}
            >
              {t('Select Camera')}
            </Typography>
            <Divider />

            {props.videoInputs && props.videoInputs.length > 0 ? (
              props.videoInputs.map((device) => (
                <MenuItem
                  key={device.deviceId}
                  onClick={() => handleCameraSelect(device.deviceId)}
                  selected={props.selectedCamera === device.deviceId}
                >
                  <ListItemIcon>
                    {props.selectedCamera === device.deviceId ? (
                      <Check sx={{ color: '#4CAF50' }} />
                    ) : (
                      <SvgIcon
                        size={20}
                        viewBox="0 0 500 500"
                        name="camera"
                        color={theme.palette.text.secondary}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={device.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <ListItemText primary={t('No cameras available')} />
              </MenuItem>
            )}
          </Menu>
        </>
      )}
    </Box>
  );
}

export default CameraButton;
