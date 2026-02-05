import React, { JSX } from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from './SvgIcon';
import { useTheme } from "@mui/material/styles";

interface DrawerButtonProps {
    handleInfoDrawerOpen?: (open: boolean) => void;
    handleMessageDrawerOpen?: (open: boolean) => void;
    handleParticipantListOpen?: (open: boolean) => void;
    handleEffectsOpen?: (open: boolean) => void;
    handleLocalRecordingDrawerOpen?: (open: boolean) => void;
    handleTranscriptionDrawerOpen?: (open: boolean) => void;
}

function DrawerButton(props: DrawerButtonProps): JSX.Element {
    const theme = useTheme();
    const [_, setHovered] = React.useState<boolean>(false);

    const handleCloseAllDrawers = (): void => {
        props?.handleInfoDrawerOpen?.(false);
        props?.handleMessageDrawerOpen?.(false);
        props?.handleParticipantListOpen?.(false);
        props?.handleEffectsOpen?.(false);
        props?.handleLocalRecordingDrawerOpen?.(false);
        props?.handleTranscriptionDrawerOpen?.(false);
    };

    return (
        <Button
            sx={{ minWidth: 30 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleCloseAllDrawers}
        >
            <SvgIcon
                size={20}
                viewBox="0 0 500 500"
                name="close"
                color={theme.palette.text.primary}
            />
        </Button>
    );
}

export default DrawerButton;