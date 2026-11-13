import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, Theme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';
import MessagesTab, { type Message, type SentMessage } from './MessagesTab';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from '../styles/themeUtil';

interface MessageDrawerProps {
  messageDrawerOpen?: boolean;
  handleInfoDrawerOpen?: (open: boolean) => void;
  handleMessageDrawerOpen?: (open: boolean) => void;
  handleParticipantListOpen?: (open: boolean) => void;
  handleEffectsOpen?: (open: boolean) => void;
  sendMessage?: (message: string, files?: File[]) => void;
  /** Adds your own message to the list once it's sent */
  handleSetMessages?: (message: SentMessage) => void;
  messages?: Message[];
  handleLocalRecordingDrawerOpen?: (open: boolean) => void;
  handleTranscriptionDrawerOpen?: (open: boolean) => void;
}

// @ts-expect-error - styled() theme callback param type mismatch
const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) =>
  getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false),
);

const MessageGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
  position: 'relative',
  padding: 16,
  background: theme.palette.themeColor?.[60],
  borderRadius: 10,
}));

const MessageDrawer = React.memo<MessageDrawerProps>((props) => {
  const { t } = useTranslation();

  return (
    <Red5Drawer
      transitionDuration={200}
      anchor="right"
      id="message-drawer"
      open={props?.messageDrawerOpen}
      variant="persistent"
      PaperProps={{ style: { pointerEvents: props?.messageDrawerOpen ? 'auto' : 'none' } }}
    >
      <MessageGrid
        container
        direction="column"
        style={{ flexWrap: 'nowrap', height: '100%', overflow: 'hidden' }}
      >
        <Grid container justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            {t('Messages')}
          </Typography>
          <CloseDrawerButton
            handleInfoDrawerOpen={(open: boolean) => props?.handleInfoDrawerOpen?.(open)}
            handleMessageDrawerOpen={props?.handleMessageDrawerOpen}
            handleParticipantListOpen={props?.handleParticipantListOpen}
            handleEffectsOpen={props?.handleEffectsOpen}
            handleLocalRecordingDrawerOpen={(open: boolean) =>
              props?.handleLocalRecordingDrawerOpen?.(open)
            }
            handleTranscriptionDrawerOpen={(open: boolean) =>
              props?.handleTranscriptionDrawerOpen?.(open)
            }
          />
        </Grid>
        <Box sx={{ flex: '1 1 auto', minHeight: 0, mt: 1 }}>
          <MessagesTab
            messages={props?.messages}
            onSend={(message, files) => props?.sendMessage?.(message, files)}
            onMessageSent={(message) => props?.handleSetMessages?.(message)}
          />
        </Box>
      </MessageGrid>
    </Red5Drawer>
  );
});

MessageDrawer.displayName = 'MessageDrawer';

export default MessageDrawer;
