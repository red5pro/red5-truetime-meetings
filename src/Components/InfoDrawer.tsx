import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, useTheme, Theme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseDrawerButton from './DrawerButton';
import { getRed5DrawerStyle } from '../styles/themeUtil';
import InfoTab from './InfoTab';
import packageJson from '../../package.json';
import { getRuntimeConfig } from '../utils/configStore';

interface InfoDrawerProps {
  infoDrawerOpen?: boolean;
  handleInfoDrawerOpen?: (open: boolean) => void;
  handleMessageDrawerOpen?: (open: boolean) => void;
  handleParticipantListOpen?: (open: boolean) => void;
  handleEffectsOpen?: (open: boolean) => void;
  handleLocalRecordingDrawerOpen?: (open: boolean) => void;
  handleTranscriptionDrawerOpen?: (open: boolean) => void;
}

// @ts-ignore
const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) =>
  getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false),
);

const InfoGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
  position: 'relative',
  padding: 16,
  background: theme.palette.themeColor?.[60],
  borderRadius: 10,
}));

const TabGrid = styled(Grid)(({}: { theme: Theme }) => ({
  position: 'relative',
  height: '100%',
  paddingBottom: 16,
  paddingTop: 16,
  flexWrap: 'nowrap',
}));

const InfoDrawer = React.memo<InfoDrawerProps>((props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const appVersion: string =
    getRuntimeConfig().VITE_VERSION ||
    `${packageJson.version}-${getRuntimeConfig().VITE_BUILD_NUMBER || 'unknown'}-${getRuntimeConfig().VITE_BUILD_HASH || 'unknown'}-${getRuntimeConfig().VITE_BUILD_TIME || 'unknown'}`;

  const meetingLink: string = window.location.href;

  return (
    <Red5Drawer
      transitionDuration={200}
      anchor="right"
      id="info-drawer"
      open={props?.infoDrawerOpen}
      variant="persistent"
      PaperProps={{ style: { pointerEvents: props?.infoDrawerOpen ? 'auto' : 'none' } }}
    >
      <InfoGrid
        container
        direction="column"
        style={{
          flexWrap: 'nowrap',
          height: '100%',
          overflow: 'hidden',
          background: theme.palette.themeColor?.[60],
        }}
      >
        <Grid container justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            {t('Meeting Details')}
          </Typography>
          <CloseDrawerButton
            handleInfoDrawerOpen={(open: boolean) => props?.handleInfoDrawerOpen?.(open)}
            handleMessageDrawerOpen={(open: boolean) => props?.handleMessageDrawerOpen?.(open)}
            handleParticipantListOpen={(open: boolean) => props?.handleParticipantListOpen?.(open)}
            handleEffectsOpen={(open: boolean) => props?.handleEffectsOpen?.(open)}
            handleLocalRecordingDrawerOpen={(open: boolean) =>
              props?.handleLocalRecordingDrawerOpen?.(open)
            }
            handleTranscriptionDrawerOpen={(open: boolean) =>
              props?.handleTranscriptionDrawerOpen?.(open)
            }
          />
        </Grid>
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          style={{ flex: '1 1 auto', overflowY: 'hidden' }}
        >
          <TabGrid container sx={{ pb: 0 }} direction="column">
            <InfoTab meetingLink={meetingLink} appVersion={appVersion} />
          </TabGrid>
        </Grid>
      </InfoGrid>
    </Red5Drawer>
  );
});

InfoDrawer.displayName = 'InfoDrawer';

export default InfoDrawer;
