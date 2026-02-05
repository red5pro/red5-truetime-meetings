import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled, Theme } from '@mui/material/styles';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';
import CloseDrawerButton from './DrawerButton';
import EffectsTab from "./EffectsTab";
import { getRed5DrawerStyle } from "../styles/themeUtil";
import { Box } from '@mui/system';

interface VirtualBackgroundImage {
    type: string;
    value: string;
}

interface BackgroundReplacement {
    type: string;
    value?: string;
}

interface EffectsDrawerProps {
    effectsDrawerOpen?: boolean;
    handleInfoDrawerOpen?: (open: boolean) => void;
    handleMessageDrawerOpen?: (open: boolean) => void;
    handleParticipantListOpen?: (open: boolean) => void;
    handleEffectsOpen?: (open: boolean) => void;
    setVirtualBackgroundImage?: (image: VirtualBackgroundImage) => void;
    handleBackgroundReplacement?: (replacement: BackgroundReplacement) => void;
    handleLocalRecordingDrawerOpen?: (open: boolean) => void;
    handleTranscriptionDrawerOpen?: (open: boolean) => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

// @ts-ignore
const Red5Drawer = styled(Drawer)(({ theme }: { theme: Theme }) => (
    getRed5DrawerStyle(theme, theme.palette.themeColor?.[60], false)
));

const EffectsGrid = styled(Grid)(({ theme }: { theme: Theme }) => ({
    position: 'relative',
    padding: 16,
    background: theme.palette.themeColor?.[70],
    borderRadius: 10,
}));

const TabGrid = styled(Grid)(({ }: { theme: Theme }) => ({
    position: 'relative',
    height: '100%',
    paddingBottom: 16,
    paddingTop: 16,
    flexWrap: 'nowrap',
}));

const EffectsDrawer = React.memo<EffectsDrawerProps>((props) => {
    const [value] = React.useState<number>(0);
    const { t } = useTranslation();

    const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
        return (
            <Box
                role="tabpanel"
                hidden={value !== index}
                id={`drawer-tabpanel-${index}`}
                aria-labelledby={`drawer-tab-${index}`}
                {...other}
                style={{ height: '100%', width: '100%' }}
            >
                {value === index && children}
            </Box>
        );
    };

    return (
        <Red5Drawer
            transitionDuration={200}
            anchor="right"
            id="effects-drawer"
            open={props?.effectsDrawerOpen}
            variant="persistent"
        >
            <EffectsGrid
                container
                direction="column"
                style={{ flexWrap: 'nowrap', height: '100%', overflow: 'hidden' }}
            >
                <Grid container justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div">
                        {t('Effects')}
                    </Typography>
                    <CloseDrawerButton
                        handleInfoDrawerOpen={(open: boolean) => props?.handleInfoDrawerOpen?.(open)}
                        handleMessageDrawerOpen={props?.handleMessageDrawerOpen}
                        handleParticipantListOpen={props?.handleParticipantListOpen}
                        handleEffectsOpen={props?.handleEffectsOpen}
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
                    <TabPanel value={value} index={0}>
                        <TabGrid container>
                            <EffectsTab
                                setVirtualBackgroundImage={(img: VirtualBackgroundImage) => props.setVirtualBackgroundImage?.(img)}
                                handleBackgroundReplacement={(mode: BackgroundReplacement) => props.handleBackgroundReplacement?.(mode)}
                            />
                        </TabGrid>
                    </TabPanel>
                </Grid>
            </EffectsGrid>
        </Red5Drawer>
    );
});

EffectsDrawer.displayName = 'EffectsDrawer';

export default EffectsDrawer;