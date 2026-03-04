import { JSX } from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { SvgIcon } from './SvgIcon';
import { useTranslation } from 'react-i18next';
import { enqueueSnackbar } from 'notistack';
import { Box } from '@mui/system';

interface InfoTabProps {
  appVersion: string;
  meetingLink: string;
}

function InfoTab({ appVersion, meetingLink }: InfoTabProps): JSX.Element {
  const { t } = useTranslation();

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(meetingLink);

      enqueueSnackbar(t('Link copied'), {
        variant: 'info',
        autoHideDuration: 1500,
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      console.error('Failed to copy to clipboard:', error);
      enqueueSnackbar(t('Failed to copy link'), {
        variant: 'error',
        autoHideDuration: 1500,
      });
    }
  };

  return (
    <>
      <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
        <Grid container sx={{ mt: 1 }} style={{ flexWrap: 'nowrap', flex: 'auto' }}>
          <Stack sx={{ width: '100%' }} spacing={3}>
            <Stack spacing={1} alignItems="flex-start" style={{ marginTop: '21px' }}>
              <Typography variant="body1" component="div">
                Joining Info
              </Typography>
              <Typography variant="body2" component="div">
                {meetingLink}
              </Typography>
              <Button style={{ marginTop: '12px' }} variant="text" onClick={handleCopyLink}>
                <SvgIcon size={16} viewBox="0 0 500 500" name="copy" color="#fff" />
                <Typography variant="subtitle1" style={{ marginLeft: '10px' }}>
                  Copy joining info
                </Typography>
              </Button>
            </Stack>
          </Stack>
        </Grid>
        <Box mt="auto" p={2} textAlign="center">
          <Typography variant="caption">Version: {appVersion}</Typography>
        </Box>
      </Box>
    </>
  );
}

export default InfoTab;
