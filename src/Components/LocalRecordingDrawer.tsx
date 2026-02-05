import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, useTheme, Theme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { Typography, Button, Divider, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from "../styles/themeUtil";
import { SvgIcon } from './SvgIcon';

interface LocalRecordingStatus {
    isRecording: boolean;
    isPaused: boolean;
    chunks: number;
    segments: number;
    estimatedSize: number;
    state: string | null;
}

interface LocalRecordingDrawerProps {
    open?: boolean;
    onClose?: (open: boolean) => void;
    status: LocalRecordingStatus | null;
    isPaused: boolean;
    isActive: boolean;
    onPause: () => void;
    onResume: () => void;
    onStart: () => void;
    onStop: () => void;
    onDownload: (filename?: string) => Promise<void> | void;
    onUpload: () => Promise<void> | void;
    onClear: () => void;
    startRecording: () => void;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    isUploading?: boolean;
    uploadProgress?: number;
    uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
    uploadError?: string | null;
    hasS3Config?: boolean;
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

const StatusItem = ({ label, value, icon }: { label: string, value: string | number, icon: string }) => {
    const theme = useTheme();
    return (
        <Grid container alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Grid>
                <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <SvgIcon size={210} name={icon} color={theme.palette.text.primary} />
                </Box>
            </Grid>
            <Grid sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {value}
                </Typography>
            </Grid>
        </Grid>
    );
};

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const LocalRecordingDrawer = React.memo<LocalRecordingDrawerProps>((props) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const {
        status, isActive, isPaused, onDownload, onClear, onUpload,
        open, onClose, isUploading, uploadProgress, uploadStatus, uploadError
    } = props;

    const renderActiveStatus = () => {
        if (isActive) return isPaused ? t('Paused') : t('Recording');
        if (status && (status.chunks > 0 || status.segments > 0)) return t('Stopped');
        return t('Inactive');
    };

    return (
        <Red5Drawer
            transitionDuration={200}
            anchor="right"
            id="local-recording-drawer"
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
                        {t('Local Recording')}
                    </Typography>
                    <CloseDrawerButton
                        handleLocalRecordingDrawerOpen={(open: boolean) => onClose?.(open)}
                    />
                </Grid>

                <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                    <StatusItem
                        label={t('Status')}
                        value={renderActiveStatus()}
                        icon={isUploading ? 'cloud-upload' : (isActive ? 'record' : 'stop')}
                    />

                    {uploadStatus === 'uploading' && (
                        <Box sx={{ mb: 3, px: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {t('Uploading to S3...')}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                    {uploadProgress}%
                                </Typography>
                            </Box>
                            <Box sx={{
                                height: 4,
                                width: '100%',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 2,
                                overflow: 'hidden'
                            }}>
                                <Box sx={{
                                    height: '100%',
                                    width: `${uploadProgress}%`,
                                    backgroundColor: theme.palette.primary.main,
                                    transition: 'width 0.3s ease-out'
                                }} />
                            </Box>
                        </Box>
                    )}

                    {uploadStatus === 'success' && (
                        <Box sx={{ mb: 3, px: 1, p: 2, borderRadius: 2, paddingLeft: '44px' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid>
                                    <SvgIcon size={24} name="check-circle" color={theme.palette.success.main} />
                                </Grid>
                                <Grid sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="white" sx={{ fontWeight: 500 }}>
                                        {t('Upload Successful')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('Recording has been uploaded to S3')}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {uploadStatus === 'error' && (
                        <Box sx={{ mb: 3, px: 1, p: 2, borderRadius: 2, paddingLeft: '44px' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid>
                                    <SvgIcon size={24} name="error" color={theme.palette.error.main} />
                                </Grid>
                                <Grid sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="white" sx={{ fontWeight: 500 }}>
                                        {t('Upload Failed')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        {uploadError || t('Unknown error occurred')}
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        onClick={() => onUpload && onUpload()}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {t('Retry Upload')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {status && (
                        <>
                            <StatusItem
                                label={t('Estimated Size')}
                                value={formatSize(status.estimatedSize)}
                                icon="database"
                            />
                            <StatusItem
                                label={t('Chunks Captured')}
                                value={status.chunks}
                                icon="arrow-right-short"
                            />
                            {status.segments > 0 && (
                                <StatusItem
                                    label={t('Completed Segments')}
                                    value={status.segments}
                                    icon="approve"
                                />
                            )}
                        </>
                    )}

                    {!isActive && !status && (
                        <Box sx={{ textAlign: 'center', mt: 4, px: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('No active local recording. Start recording below.')}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 3, opacity: 0.1 }} />

                <Grid container spacing={2}>
                    {!isActive && status && (
                        <>
                            <Grid size={6}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SvgIcon size={18} name="download" color="#FFF" />}
                                    onClick={() => onDownload()}
                                    sx={{ borderRadius: 6, py: 1 }}
                                >
                                    {t('Download')}
                                </Button>
                            </Grid>
                            <Grid size={6}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="inherit"
                                    onClick={onClear}
                                    disabled={isUploading}
                                    sx={{ borderRadius: 6, py: 1, opacity: 0.7 }}
                                >
                                    {t('Clear')}
                                </Button>
                            </Grid>
                        </>
                    )}
                </Grid>
            </ContentGrid>
        </Red5Drawer>
    );
});

LocalRecordingDrawer.displayName = 'LocalRecordingDrawer';

export default LocalRecordingDrawer;
