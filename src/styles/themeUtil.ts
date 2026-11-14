import { Theme, SxProps } from '@mui/material/styles';
import { radii, shadows, themeColors } from 'truetime-ui';
import { FOOTER_HEIGHT } from '../constants/layout';

// Type for drawer style return object
interface DrawerStyleObject {
  '& .MuiBackdrop-root': {
    backgroundColor: string;
  };
  '& .MuiPaper-root': SxProps<Theme>;
}

// Type for dialog and menu style return objects
interface StyleObject {
  [key: string]: any;
}

export function getRed5DrawerStyle(
  theme: Theme,
  color: string = '#FFFFFF',
  glass: boolean = false,
): DrawerStyleObject {
  return {
    '& .MuiBackdrop-root': {
      backgroundColor: 'transparent',
    },
    '& .MuiPaper-root': {
      // .App centres its text (App.css); panels read left to right
      textAlign: 'left',
      padding: 12,
      background: 'transparent',
      width: 360,
      height: `calc(100dvh - ${FOOTER_HEIGHT}px)`,
      [theme.breakpoints.down('sm')]: {
        width: '100%',
        padding: 0,
        backgroundColor: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        boxShadow: 'unset',
        border: 'unset',
      },

      ...(glass
        ? {
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${color}55`,
            boxShadow: shadows.glass,
          }
        : {
            backgroundColor: 'transparent',
            boxShadow: 'unset', // fallback to default MUI elevation
            border: 'none',
          }),
    },
  };
}

/**
 * Dialogs and menus sit on the same raised surface as the call controls, their trays and the device
 * lists, so they read as one set in every theme.
 */
export function getDialogStyle(theme: Theme): StyleObject {
  return {
    position: 'relative',
    overflow: 'hidden',
    background: themeColors(theme).surfaceRaised,
    borderRadius: `${radii.container}px`,
  };
}

/**
 * Menus opened from the call controls. They open upwards from the footer, so they're capped at the
 * space above it and scroll when their items don't fit (e.g. the options menu on a short window).
 */
export function getGlassMenuStyle(theme: Theme, _p0: string, _p1: boolean): StyleObject {
  return {
    overflowX: 'hidden',
    overflowY: 'auto',
    maxHeight: `calc(100dvh - ${FOOTER_HEIGHT + 16}px)`,
    scrollbarWidth: 'thin',
    background: themeColors(theme).surfaceRaised,
    borderRadius: `${radii.container}px`,
  };
}

export const getIconName = (
  iconBaseName: string,
  isDisabled: boolean,
  isHover: boolean,
): string => {
  if (isDisabled) return iconBaseName + '-disabled';
  if (isHover) return iconBaseName + '-hover';
  return iconBaseName + '-active';
};
