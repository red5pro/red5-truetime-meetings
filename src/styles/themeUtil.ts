import { Theme, SxProps } from '@mui/material/styles';

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
      padding: 12,
      background: 'transparent',
      width: 360,
      height: 'calc(100vh - 80px)',
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
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(255, 255, 255, 0.05),
              inset 0 0 20px 10px rgba(255, 255, 255, 0.05)
            `,
          }
        : {
            backgroundColor: 'transparent',
            boxShadow: 'unset', // fallback to default MUI elevation
            border: 'none',
          }),
    },
  };
}

export function getDialogStyle(theme: Theme): StyleObject {
  return {
    position: 'relative',
    overflow: 'hidden',
    background: theme.palette.themeColor?.[90],
    borderRadius: '12px',
  };
}

export function getGlassMenuStyle(theme: Theme, p0: string, p1: boolean): StyleObject {
  return {
    overflow: 'hidden',
    background: theme.palette.themeColor?.[90],
    borderRadius: '12px',
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
