import { JSX } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ContentCopy, Link as LinkIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { enqueueSnackbar } from 'notistack';
import { Button, Heading, Text, radii, themeColors } from 'truetime-ui';

interface InfoTabProps {
  appVersion: string;
  buildTime: string;
  meetingLink: string;
}

function InfoTab({ appVersion, buildTime, meetingLink }: InfoTabProps): JSX.Element {
  const { t } = useTranslation();

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      enqueueSnackbar(t('Link copied'), { variant: 'info', autoHideDuration: 1500 });
    } catch (error) {
      // Browsers without the clipboard API, or without permission to use it
      console.error('Failed to copy to clipboard:', error);
      enqueueSnackbar(t('Failed to copy link'), { variant: 'error', autoHideDuration: 1500 });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Joining info, centred in the panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 2,
          px: 1,
        }}
      >
        <Box
          aria-hidden
          sx={(theme) => ({
            width: 56,
            height: 56,
            borderRadius: radii.round,
            display: 'grid',
            placeItems: 'center',
            color: themeColors(theme).text,
            backgroundColor: alpha(themeColors(theme).text, 0.08),
          })}
        >
          <LinkIcon />
        </Box>

        <Box>
          <Heading level={3} variant="h6">
            {t('Joining info')}
          </Heading>
          <Text tone="muted" variant="body2" sx={{ mt: 0.5 }}>
            {t('Share this link to invite people to the meeting')}
          </Text>
        </Box>

        <Box
          id="meeting-link"
          sx={(theme) => ({
            width: '100%',
            px: 2,
            py: 1.5,
            borderRadius: `${radii.container}px`,
            backgroundColor: themeColors(theme).surface,
            wordBreak: 'break-all',
          })}
        >
          <Text variant="body2" mono>
            {meetingLink}
          </Text>
        </Box>

        <Button
          id="copy-joining-info-button"
          shape="pill"
          color="secondary"
          startIcon={<ContentCopy fontSize="small" />}
          onClick={handleCopyLink}
        >
          {t('Copy joining info')}
        </Button>
      </Box>

      {/* Build details */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Text variant="caption" tone="muted" component="div">
          {t('Version')} {appVersion}
        </Text>
        {appVersion.endsWith('-beta') && (
          <Text variant="caption" tone="muted" component="div">
            {t('Build')} {buildTime}
          </Text>
        )}
      </Box>
    </Box>
  );
}

export default InfoTab;
