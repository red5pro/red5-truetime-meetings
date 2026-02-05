import Drawer from '@mui/material/Drawer';
import { styled, useTheme, Theme } from '@mui/material/styles';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';
import ParticipantTab from './ParticipantTab';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from "../styles/themeUtil";
import { memo } from "react";

interface Participant {
    streamId: string;
    streamName: string;
}

interface ParticipantListDrawerProps {
    participantListDrawerOpen?: boolean;
    handleInfoDrawerOpen?: (open: boolean) => void;
    handleMessageDrawerOpen?: (open: boolean) => void;
    handleParticipantListOpen?: (open: boolean) => void;
    handleEffectsOpen?: (open: boolean) => void;
    globals?: any;
    participantCount?: number;
    isMyMicMuted?: boolean;
    publishStreamId?: string;
    muteLocalMic?: () => void;
    participants?: Record<string, Participant>;
    role?: string;
    blockUser?: (userId: string, duration?: number) => void;
    guestsWaitingApproval?: Record<string, any>;
    approveGuest?: (userId: string) => Promise<void>;
    rejectGuest?: (userId: string) => Promise<void>;
    handleLocalRecordingDrawerOpen?: (open: boolean) => void;
    handleTranscriptionDrawerOpen?: (open: boolean) => void;
}

// @ts-ignore
const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) => (
    getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false)
));

const ParticipantListGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
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

const ParticipantListDrawer = memo<ParticipantListDrawerProps>((props) => {
    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <Red5Drawer
            transitionDuration={200}
            anchor="right"
            id="participant-list-drawer"
            open={props?.participantListDrawerOpen}
            variant="persistent"
        >
            <ParticipantListGrid
                container
                direction="column"
                style={{
                    flexWrap: 'nowrap',
                    height: '100%',
                    overflow: 'hidden',
                    background: theme.palette.themeColor?.[60]
                }}
            >
                <Grid container justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div">
                        {t('Participants')}
                    </Typography>
                    <CloseDrawerButton
                        handleInfoDrawerOpen={(open: boolean) => props?.handleInfoDrawerOpen?.(open)}
                        handleMessageDrawerOpen={(open: boolean) => props?.handleMessageDrawerOpen?.(open)}
                        handleParticipantListOpen={(open: boolean) => props?.handleParticipantListOpen?.(open)}
                        handleEffectsOpen={(open: boolean) => props?.handleEffectsOpen?.(open)}
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
                    <TabGrid container sx={{ pb: 0 }} direction="column">
                        <ParticipantTab
                            globals={props?.globals}
                            participantCount={props?.participantCount ?? 0}
                            isMyMicMuted={props?.isMyMicMuted}
                            publishStreamId={props?.publishStreamId ?? ''}
                            muteLocalMic={() => props?.muteLocalMic?.()}
                            //@ts-ignore
                            participants={props?.participants}
                            role={props?.role ?? ''}
                            blockUser={(userId: string, duration?: number) => props?.blockUser?.(userId, duration)}
                            guestsWaitingApproval={props?.guestsWaitingApproval ?? {}}
                            approveGuest={props?.approveGuest}
                            rejectGuest={props?.rejectGuest}
                        />
                    </TabGrid>
                </Grid>
            </ParticipantListGrid>
        </Red5Drawer>
    );
});

ParticipantListDrawer.displayName = 'ParticipantListDrawer';

export default ParticipantListDrawer;