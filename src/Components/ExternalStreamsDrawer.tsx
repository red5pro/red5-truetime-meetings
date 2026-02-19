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

interface ExternalStreamsDrawerProps {
    open?: boolean;
    onClose?: (open: boolean) => void;
    streams: ExternalStream[];
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
        open, onClose, streams, fetchStreams, addToRoom, loading, error
    } = props;

    useEffect(() => {
        if (open) {
            fetchStreams();
        }
    }, [open, fetchStreams]);

    const handleAdd = async (streamName: string) => {
        try {
            await addToRoom(streamName);
            // Optionally refetch or show success
        } catch (error) {
            // Error handled by hook
        }
    };

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
                    ) : streams.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                            {t('No external streams available.')}
                        </Typography>
                    ) : (
                        <List sx={{ background: theme.palette.themeColor?.[60] }}>
                            {streams.map((stream) => (
                                <ListItem
                                    key={stream.streamGuid}
                                    sx={{
                                        mb: 2,
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: 2,
                                        '&:hover': {
                                            background: 'rgba(255, 255, 255, 0.05)'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={stream.streamName}
                                        secondary={
                                            <></>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => handleAdd(stream.streamName)}
                                            sx={{
                                                borderRadius: 4,
                                                textTransform: 'none',
                                                fontSize: '0.75rem',
                                                py: 0.5
                                            }}
                                        >
                                            {t('Add to Room')}
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
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
