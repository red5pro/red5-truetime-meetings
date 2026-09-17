import { JSX, lazy, Suspense } from 'react';
import { useTheme } from '@mui/material/styles';
import { Route, Routes } from 'react-router-dom';
import { Backdrop, CircularProgress, Grid } from '@mui/material';
import ProtectedRoute from './Components/ProtectedRoute.tsx';

const Home = lazy(() => import('./pages/Home/Home.tsx'));
const Red5 = lazy(() => import('./pages/Red5/Red5.tsx'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage.tsx'));
const MobileLayoutPreview = lazy(
  () => import('./pages/MobileLayoutPreview/MobileLayoutPreview.tsx'),
);

function RouteFallback(): JSX.Element {
  return (
    <Backdrop sx={{ color: '#fff' }} open>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}

function CustomRoutes(): JSX.Element {
  const theme = useTheme();

  return (
    <Grid
      container
      sx={{ width: '100%', maxWidth: '100%', background: theme.palette.background.default }}
    >
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          {import.meta.env.DEV && (
            <Route path="/mobile-layout-preview" element={<MobileLayoutPreview />} />
          )}
          <Route element={<ProtectedRoute />}>
            <Route path="/:id" element={<Red5 />} />
          </Route>
        </Routes>
      </Suspense>
    </Grid>
  );
}

export default CustomRoutes;
