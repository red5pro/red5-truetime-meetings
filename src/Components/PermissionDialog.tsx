import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    Button,
    Box,
    Typography,
    useTheme,
    useMediaQuery,
    CircularProgress
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { SvgIcon } from './SvgIcon.tsx'
import { getDialogStyle } from '../styles/themeUtil.js'
import { useTranslation } from 'react-i18next'

interface InitialPermissionDialogProps {
    open: boolean
    onRequestPermissions: () => void
}

interface RequestingPermissionDialogProps {
    open: boolean
}

interface PermissionDeniedDialogProps {
    open: boolean
    onTryAgain: () => void
}

interface PermissionGrantedDialogProps {
    open: boolean
    onJoinMeeting: () => void
}

interface PermissionFlowManagerProps {
    open: boolean
    setIsPermissionDialogVisible?: (visible: boolean) => void
    localVideoCreate: () => void
    updateDevicesList: () => void
    setCameraPermissionState: (state: string) => void
    setMicrophonePermissionState: (state: string) => void
}

type PermissionStep = 'initial' | 'requesting' | 'denied' | 'granted'

// Initial Permission Dialog
export function InitialPermissionDialog({ open, onRequestPermissions }: InitialPermissionDialogProps) {
    const { t } = useTranslation()
    const theme = useTheme()
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'))

    const handleUseDevices = async () => {
        onRequestPermissions()
    }

    return (
        <Dialog
            open={open}
            fullScreen={fullScreen}
            maxWidth="sm"
            PaperProps={{
                sx: {
                    ...getDialogStyle(theme),
                    minWidth: '400px',
                    '@media (max-width: 600px)': {
                        minWidth: '90vw'
                    }
                }
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(0.5px)',
                }
            }}
        >
            <DialogContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        color: '#FFF',
                        fontWeight: 500,
                        mb: 2,
                        fontSize: { xs: '1.5rem', sm: '1.75rem' }
                    }}
                >
                    {t('Join meeting with camera and microphone?')}
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: '#FFF',
                        mb: 4,
                        fontSize: '1rem',
                        lineHeight: 1.5
                    }}
                >
                    {t('Your audio and video settings can be adjusted at any point during the meeting.')}
                </Typography>

                <Grid container spacing={2} justifyContent="center">
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <Button
                            color="secondary"
                            variant="contained"
                            id="give_device_permission_button"
                            fullWidth
                            onClick={handleUseDevices}
                            sx={{
                                borderRadius: 6
                            }}
                        >
                            {t('Join with audio and video')}
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    )
}

// Requesting Permission Dialog
export function RequestingPermissionDialog({ open }: RequestingPermissionDialogProps) {
    const { t } = useTranslation()
    const theme = useTheme()
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'))

    return (
        <Dialog
            open={open}
            fullScreen={fullScreen}
            maxWidth="sm"
            PaperProps={{
                sx: {
                    ...getDialogStyle(theme),
                    minWidth: '400px',
                    '@media (max-width: 600px)': {
                        minWidth: '90vw'
                    }
                }
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(0.5px)',
                }
            }}
        >
            <DialogContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ mb: 4 }}>
                    <CircularProgress
                        size={48}
                        sx={{
                            color: '#FFF',
                            mb: 2
                        }}
                    />
                </Box>

                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        color: '#FFF',
                        fontWeight: 500,
                        mb: 2,
                        fontSize: { xs: '1.5rem', sm: '1.75rem' }
                    }}
                >
                    {t('Requesting permissions...')}
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: '#FFF',
                        fontSize: '1rem',
                        lineHeight: 1.5,
                        opacity: 0.9
                    }}
                >
                    {t('Please allow access to your camera and microphone when prompted by your browser.')}
                </Typography>
            </DialogContent>
        </Dialog>
    )
}

// Permission Denied Dialog
export function PermissionDeniedDialog({ open }: PermissionDeniedDialogProps) {
    const { t } = useTranslation()
    const theme = useTheme()
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'))

    return (
        <Dialog
            open={open}
            fullScreen={fullScreen}
            maxWidth="sm"
            PaperProps={{
                sx: {
                    ...getDialogStyle(theme),
                    minWidth: '400px',
                    '@media (max-width: 600px)': {
                        minWidth: '90vw'
                    }
                }
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(0.5px)',
                }
            }}
        >
            <DialogContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ mb: 3 }}>
                    <SvgIcon
                        size={72}
                        viewBox="0 0 500 500"
                        name="alert-circle"
                        color="#FFB74D"
                    />
                </Box>

                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        color: '#FFF',
                        fontWeight: 500,
                        mb: 2,
                        fontSize: { xs: '1.5rem', sm: '1.75rem' }
                    }}
                >
                    {t('Camera and microphone access needed')}
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: '#FFF',
                        mb: 3,
                        fontSize: '1rem',
                        lineHeight: 1.5
                    }}
                >
                    {t('To join with audio and video, please allow access:')}
                </Typography>

                <Box
                    sx={{
                        backgroundColor: 'rgba(5, 5, 5, 0.8)',
                        borderRadius: 2,
                        borderColor: 'white',
                        borderWidth: 2,
                        p: 3,
                        mb: 4,
                        textAlign: 'left'
                    }}
                >
                    <Typography variant="body2" sx={{ color: '#FFF', mb: 2, fontWeight: 500 }}>
                        {t('Instructions:')}
                    </Typography>
                    <Box component="ol" sx={{ color: '#FFF', pl: 2, '& li': { mb: 1, fontSize: '0.9rem' } }}>
                        <li>{t('Look for the camera/microphone icon in your address bar')}</li>
                        <li>{t('Click on it and select "Allow"')}</li>
                        {/*<li>{t('Click "Try again" below')}</li>*/}
                    </Box>
                </Box>

                {/*
        <Grid container spacing={2} justifyContent="center">
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              color="secondary"
              variant="contained"
              fullWidth
              onClick={onTryAgain}
              sx={{
                borderRadius: 6
              }}
            >
              {t('Try again')}
            </Button>
          </Grid>
        </Grid>
        */}
            </DialogContent>
        </Dialog>
    )
}

// Permission Granted Dialog
export function PermissionGrantedDialog({ open, onJoinMeeting }: PermissionGrantedDialogProps) {
    const { t } = useTranslation()
    const theme = useTheme()
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'))

    return (
        <Dialog
            open={open}
            fullScreen={fullScreen}
            maxWidth="sm"
            PaperProps={{
                sx: {
                    ...getDialogStyle(theme),
                    minWidth: '400px',
                    '@media (max-width: 600px)': {
                        minWidth: '90vw'
                    }
                }
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(0.5px)',
                }
            }}
        >
            <DialogContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ mb: 3 }}>
                    <SvgIcon
                        size={48}
                        viewBox="0 0 500 500"
                        name="check-circle"
                        color="#4CAF50"
                    />
                </Box>

                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        color: '#FFF',
                        fontWeight: 500,
                        mb: 2,
                        fontSize: { xs: '1.5rem', sm: '1.75rem' }
                    }}
                >
                    {t('Perfect! You\'re all set')}
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: '#FFF',
                        mb: 4,
                        fontSize: '1rem',
                        lineHeight: 1.5
                    }}
                >
                    {t('Camera and microphone access granted. You can now join the meeting with full audio and video.')}
                </Typography>

                <Grid container spacing={2} justifyContent="center">
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <Button
                            color="primary"
                            variant="contained"
                            fullWidth
                            onClick={onJoinMeeting}
                            sx={{
                                borderRadius: 6,
                                backgroundColor: '#4CAF50',
                                '&:hover': {
                                    backgroundColor: '#45A049'
                                }
                            }}
                        >
                            {t('Join meeting')}
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    )
}

// Main Permission Flow Manager
export default function PermissionFlowManager({
                                                  open,
                                                  setIsPermissionDialogVisible,
                                                  localVideoCreate,
                                                  updateDevicesList,
                                                  setCameraPermissionState,
                                                  setMicrophonePermissionState
                                              }: PermissionFlowManagerProps) {
    const [currentStep, setCurrentStep] = useState<PermissionStep>('initial')

    const requestPermissions = async () => {
        setCurrentStep('requesting')

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            })

            mediaStream.getTracks().forEach(track => track.stop())
            setCurrentStep('granted')

        } catch (error) {
            console.error('Permission denied:', error)

            if (error instanceof Error && error.name === 'NotAllowedError') {
                setCurrentStep('denied')
            } else {
                setCurrentStep('denied')
            }
        }
    }

    const handleJoinMeeting = () => {
        if (setIsPermissionDialogVisible) {
            setIsPermissionDialogVisible(false)
            localVideoCreate()
            updateDevicesList()
            setCameraPermissionState('granted')
            setMicrophonePermissionState('granted')
        }
    }

    // Reset to initial state and check permissions whenever dialog opens
    useEffect(() => {
        if (open) {
            setCurrentStep('initial')

            // Check current permission state
            const checkPermissions = async () => {
                try {
                    const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
                    const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })

                    // If both are already granted, auto-request to verify they still work
                    if (cameraPermission.state === 'granted' && micPermission.state === 'granted') {
                        requestPermissions()
                    }
                } catch (error) {
                    // Permissions API not supported, just show initial dialog
                    console.log('Permissions API not available', error)
                }
            }

            checkPermissions()
        }
    }, [open])

    return (
        <>
            <InitialPermissionDialog
                open={open && currentStep === 'initial'}
                onRequestPermissions={requestPermissions}
            />

            <RequestingPermissionDialog
                open={open && currentStep === 'requesting'}
            />

            <PermissionDeniedDialog
                open={open && currentStep === 'denied'}
                onTryAgain={requestPermissions}
            />

            <PermissionGrantedDialog
                open={open && currentStep === 'granted'}
                onJoinMeeting={handleJoinMeeting}
            />
        </>
    )
}