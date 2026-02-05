import React, { JSX } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { getRuntimeConfig } from '../utils/configStore';

interface ProtectedRouteProps {
    redirectPath?: string;
    children?: React.ReactNode;
}

const ProtectedRoute = ({ redirectPath = '/login', children }: ProtectedRouteProps): JSX.Element => {
    const { isAuthenticated } = useGoogleAuth();
    const location = useLocation();
    const config = getRuntimeConfig();
    const isAuthEnabled = config.VITE_ENABLE_GOOGLE_AUTH === 'true';

    if (isAuthEnabled && !isAuthenticated) {
        return <Navigate to={redirectPath} replace state={{ from: location }} />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;