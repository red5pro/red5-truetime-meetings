import React, { forwardRef, useCallback } from 'react';
import { SnackbarContent, useSnackbar } from 'notistack';
import { styled } from '@mui/material/styles';
import { Grid, Typography, useTheme, Theme } from '@mui/material';
import { radii, themeColors } from 'truetime-ui';
import { SvgIcon } from './SvgIcon';

// Styled components
const Red5SnackInfo = styled(Grid)(({ theme }: { theme: Theme }) => ({
  backgroundColor: theme.palette.themeColor?.[60],
  borderRadius: radii.control,
  padding: 8,
}));

const Red5SnackMessage = styled(Grid)(({ theme }: { theme: Theme }) => ({
  backgroundColor: theme.palette.themeColor?.[60],
  borderRadius: radii.control,
  padding: '16px 16px 12px 16px',
  cursor: 'pointer',
  width: 320,
  maxWidth: 'calc(100vw - 32px)',
}));

const Red5SnackContent = styled(SnackbarContent)(({}: { theme: Theme }) => ({}));

// Props interface
interface SnackMessageProps {
  variant: 'info' | 'message';
  message: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  sender?: string;
}

// Component
const SnackMessage = forwardRef<HTMLDivElement, SnackMessageProps>((props, ref) => {
  const { variant, message, icon, onClick, sender } = props;
  const { closeSnackbar } = useSnackbar();

  const theme = useTheme();

  const handleDismiss = useCallback(() => {
    closeSnackbar();
  }, [closeSnackbar]);

  return (
    <Red5SnackContent ref={ref}>
      {variant === 'info' && (
        <Red5SnackInfo container justifyContent={'center'} alignItems={'center'}>
          {icon && (
            <Grid item sx={{ mr: 0.5 }}>
              {icon}
            </Grid>
          )}
          <Typography variant="subtitle2" color={theme.palette.themeColor?.[0]}>
            {message}
          </Typography>
        </Red5SnackInfo>
      )}
      {variant === 'message' && (
        <Red5SnackMessage
          container
          onClick={() => {
            onClick?.();
            handleDismiss();
          }}
        >
          <Grid container alignItems="center">
            <SvgIcon
              size={24}
              viewBox="0 0 500 500"
              color={themeColors(theme).text}
              name={'message-off'}
            />
            <Typography
              sx={{ ml: 0.5 }}
              variant="subtitle2"
              color={theme.palette.themeColor?.[0]}
            >{`${sender}`}</Typography>
          </Grid>
          <Grid container sx={{ mt: 1 }} style={{ marginLeft: 6 }}>
            <Typography
              variant="subtitle2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
                overflowWrap: 'anywhere',
              }}
              color={theme.palette.themeColor?.[0]}
            >
              {message}
            </Typography>
          </Grid>
        </Red5SnackMessage>
      )}
    </Red5SnackContent>
  );
});

SnackMessage.displayName = 'SnackMessage';

export default SnackMessage;
