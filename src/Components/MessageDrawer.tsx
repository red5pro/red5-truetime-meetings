import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, Theme } from '@mui/material/styles';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import MessageInput from './MessageInput';
import { useTranslation } from 'react-i18next';
import MessagesTab from './MessagesTab';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from "../styles/themeUtil";
import { Box } from '@mui/system';

interface Message {
    id?: string;
    text: string;
    sender: string;
    timestamp: number;
    // Add other message properties as needed
}

interface MessageDrawerProps {
    messageDrawerOpen?: boolean;
    handleInfoDrawerOpen?: (open: boolean) => void;
    handleMessageDrawerOpen?: (open: boolean) => void;
    handleParticipantListOpen?: (open: boolean) => void;
    handleEffectsOpen?: (open: boolean) => void;
    sendMessage?: (message: string) => void;
    handleSetMessages?: (messages: Message[]) => void;
    messages?: Message[];
    handleLocalRecordingDrawerOpen?: (open: boolean) => void;
    handleTranscriptionDrawerOpen?: (open: boolean) => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

// @ts-ignore
const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) => (
    getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false)
));

const MessageGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
    position: 'relative',
    padding: 16,
    background: theme.palette.themeColor?.[60],
    borderRadius: 10,
}));

const TabGrid = styled(Grid)(({ }: { theme: Theme }) => ({
    position: 'relative',
    height: '100%',
    paddingBottom: 16,
    paddingTop: 16,
    flexWrap: 'nowrap',
}));

const MessageDrawer = React.memo<MessageDrawerProps>((props) => {
    const [value] = React.useState<number>(0);
    const { t } = useTranslation();

    const TabPanel = React.useMemo(() => {
        return ({ children, value, index }: TabPanelProps) => {
            return (
                <Box
                    role="tabpanel"
                    hidden={value !== index}
                    id={`drawer-tabpanel-${index}`}
                    aria-labelledby={`drawer-tab-${index}`}
                    style={{ height: '100%', width: '100%', overflowY: 'auto' }}
                >
                    {value === index && children}
                </Box>
            );
        };
    }, []);

    return (
        <Red5Drawer
            transitionDuration={200}
            anchor="right"
            id="message-drawer"
            open={props?.messageDrawerOpen}
            variant="persistent"
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
                        handleLocalRecordingDrawerOpen={(open: boolean) => props?.handleLocalRecordingDrawerOpen?.(open)}
                        handleTranscriptionDrawerOpen={(open: boolean) => props?.handleTranscriptionDrawerOpen?.(open)}
                    />
                </Grid>
                <Grid
                    container
                    justifyContent="space-between"
                    alignItems="center"
                    style={{ flex: '1 1 auto', overflowY: 'hidden' }}
                >
                    <TabPanel value={value} index={0}>
                        <TabGrid container sx={{ pb: 0 }} direction="column">
                            <MessagesTab messages={props?.messages} />
                        </TabGrid>
                    </TabPanel>
                </Grid>

                <MessageInput
                    handleSendMessage={(message: string, files?: File[]) => props?.sendMessage?.(message, files)}
                    //@ts-ignore
                    handleSetMessages={(messages: Message[]) => props?.handleSetMessages?.(messages)}
                />
            </MessageGrid>
        </Red5Drawer>
    );
});

MessageDrawer.displayName = 'MessageDrawer';

export default MessageDrawer;