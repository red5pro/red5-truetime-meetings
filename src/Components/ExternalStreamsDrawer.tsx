import * as React from 'react';
import { useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, useTheme, Theme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { Typography, Button, Divider, Box, List, ListItem, ListItemText, ListItemSecondaryAction, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from "../styles/themeUtil";
import { SvgIcon } from './SvgIcon';
import { ExternalStream } from '../hooks/useExternalStreams';

import { parseMetaData } from '../utils/utils';
import { MetaDataKeys } from '../constants/metaDataKeys';

interface ExternalStreamsDrawerProps {
    open?: boolean;
    onClose?: (open: boolean) => void;
    streams: ExternalStream[];
    participants: Record<string, any>;
    fetchStreams: () => Promise<ExternalStream[]>;
    addToRoom: (streamName: string) => Promise<void>;
    removeFromRoom: (streamName: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) => ({
    ...getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false)
}));

const ContentGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
    position: 'relative',
    padding: 24,
    background: theme.palette.themeColor?.[60],
    borderRadius: 10,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
}));

const ExternalStreamsDrawer = React.memo<ExternalStreamsDrawerProps>((props) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const {
        open, onClose, streams, participants, fetchStreams, addToRoom, removeFromRoom, loading, error
    } = props;

    useEffect(() => {
        if (open) {
            fetchStreams();
        }
    }, [open, fetchStreams]);

    const handleAdd = async (streamName: string) => {
        try {
            await addToRoom(streamName);
            await fetchStreams();
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleRemove = async (streamName: string) => {
        try {
            await removeFromRoom(streamName);
            await fetchStreams();
        } catch (error) {
            // Error handled by hook
        }
    };

    const sortedStreams = React.useMemo(() => {
        const participantEntries = Object.values(participants);

        const isJoined = (streamName: string) => {
            return participantEntries.some(p => {
                const meta = parseMetaData(p.metaData);
                return p.uid === streamName || meta[MetaDataKeys.NAME] === streamName && (p.uid === streamName || meta[MetaDataKeys.NAME] === streamName);
            });
        };

        return [...streams].sort((a, b) => {
            const aJoined = isJoined(a.streamName);
            const bJoined = isJoined(b.streamName);
            if (aJoined && !bJoined) return -1;
            if (!aJoined && bJoined) return 1;
            return 0;
        });
    }, [streams, participants]);

    return (
        <Red5Drawer
            transitionDuration={200}
            anchor="right"
            id="external-streams-drawer"
            open={open}
            variant="persistent"
        >
            <ContentGrid
                container
                direction="column"
                style={{
                    flexWrap: 'nowrap',
                    background: theme.palette.themeColor?.[60]
                }}
            >
                <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Typography variant="h6" component="div">
                        {t('External Streams')}
                    </Typography>
                    <CloseDrawerButton
                        handleExternalStreamsDrawerOpen={(open: boolean) => onClose?.(open)}
                    />
                </Grid>

                <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                    {loading && streams.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <CircularProgress size={32} color="inherit" />
                        </Box>
                    ) : error ? (
                        <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                            {error}
                        </Typography>
                    ) : sortedStreams.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                            {t('No external streams available.')}
                        </Typography>
                    ) : (
                        <List sx={{ background: theme.palette.themeColor?.[60] }}>
                            {sortedStreams.map((stream) => {
                                const participantEntries = Object.values(participants);
                                const joinedParticipant = participantEntries.find(p => {
                                    const meta = parseMetaData(p.metaData);
                                    return p.uid === stream.streamName || meta[MetaDataKeys.NAME] === stream.streamName || (meta[MetaDataKeys.EXTERNAL_STREAM] === 'external-stream' && (p.uid === stream.streamName || meta[MetaDataKeys.NAME] === stream.streamName));
                                });
                                const isJoined = !!joinedParticipant;

                                return (
                                    <ListItem
                                        key={stream.streamGuid}
                                        sx={{
                                            mb: 2,
                                            background: isJoined ? 'rgba(36, 255, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: 2,
                                            '&:hover': {
                                                background: isJoined ? 'rgba(36, 255, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)'
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={stream.streamName}
                                            secondary={isJoined ? t('Joined') : null}
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                variant={isJoined ? "outlined" : "contained"}
                                                color={isJoined ? "error" : "primary"}
                                                size="small"
                                                onClick={() => isJoined ? handleRemove(stream.streamName) : handleAdd(stream.streamName)}
                                                sx={{
                                                    borderRadius: 4,
                                                    textTransform: 'none',
                                                    fontSize: '0.75rem',
                                                    py: 0.5
                                                }}
                                            >
                                                {isJoined ? t('Remove from Room') : t('Add to Room')}
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Box>

                <Divider sx={{ my: 3, opacity: 0.1 }} />

                <Grid container spacing={2}>
                    <Grid size={12}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="inherit"
                            onClick={() => fetchStreams()}
                            startIcon={<SvgIcon size={18} name="refresh" color="#FFF" />}
                            sx={{ borderRadius: 6, py: 1, opacity: 0.7 }}
                        >
                            {t('Refresh List')}
                        </Button>
                    </Grid>
                </Grid>
            </ContentGrid>
        </Red5Drawer>
    );
});

ExternalStreamsDrawer.displayName = 'ExternalStreamsDrawer';

export default ExternalStreamsDrawer;
