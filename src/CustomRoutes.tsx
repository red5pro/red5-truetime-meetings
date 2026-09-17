import { JSX } from 'react';
import { useTheme } from '@mui/material/styles';
import { Route, Routes } from 'react-router-dom';
import { Grid } from '@mui/material';
import Home from './pages/Home/Home.tsx';
import Red5 from './pages/Red5/Red5.tsx';
import LoginPage from './pages/Login/LoginPage.tsx';
import ProtectedRoute from './Components/ProtectedRoute.tsx';
import MobileLayoutPreview from './pages/MobileLayoutPreview/MobileLayoutPreview.tsx';

function CustomRoutes(): JSX.Element {
  const theme = useTheme();

  return (
    <Grid
      container
      sx={{ width: '100%', maxWidth: '100%', background: theme.palette.background.default }}
    >
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
    </Grid>
  );
}

export default CustomRoutes;
