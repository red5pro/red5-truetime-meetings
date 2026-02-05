import React, { JSX } from 'react';
import { Typography, Box, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import log from 'loglevel';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRuntimeConfig } from '../../utils/configStore';
import Logo from '../../static/images/logo.svg';
import { useTranslation } from 'react-i18next';

const LoginPage = (): JSX.Element => {
    const { setCredential, isAuthenticated, loginAsGuest } = useGoogleAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const config = getRuntimeConfig();
    const isAuthEnabled = config.VITE_ENABLE_GOOGLE_AUTH === 'true';
    const logoUrl = config.VITE_LOGO_URL || Logo;

    // Redirect if already authenticated OR if auth is disabled
    React.useEffect(() => {
        if (isAuthenticated || !isAuthEnabled) {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, isAuthEnabled, navigate, location]);

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            sx={{
                minHeight: '100vh',
                px: 2,
                width: '100%'
            }}
        >
            <Grid size={{ xs: 12, sm: 10, md: 8, lg: 6 }} sx={{ width: '100%' }}>
                <Box textAlign="center">
                    <Box sx={{ mb: 2 }}>
                        <img src={logoUrl} alt="Red5 Logo" style={{ maxWidth: '100%', maxHeight: '100px' }} />
                    </Box>
                    <Typography variant="h6" align="center" sx={{ mb: 4 }}>
                        {t('TrueTime Meeting')}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', mt: 4, gap: 2 }}>
                        <GoogleLogin
                            theme="filled_black"
                            shape="pill"
                            size="large"
                            onSuccess={(credentialResponse) => {
                                if (credentialResponse.credential) {
                                    setCredential(credentialResponse.credential);
                                    // Navigation handled by useEffect above once state updates
                                }
                            }}
                            onError={() => {
                                log.error('Login Failed');
                            }}
                        />
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => loginAsGuest()}
                            sx={{
                                textTransform: 'none',
                                borderRadius: '20px',
                                px: 3,
                                py: '10px', // Match height roughly with Google button
                                borderColor: 'rgba(0, 0, 0, 0.23)',
                                fontSize: '14px',
                                fontWeight: 500,
                                height: '40px', // Explicit height to match Google button's large size
                            }}
                        >
                            {t('Join as Guest')}
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

export default LoginPage;