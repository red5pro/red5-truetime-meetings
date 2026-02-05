import React from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface InfoButtonProps {
    infoDrawerOpen?: boolean;
    handleInfoDrawerOpen?: (open: boolean) => void;
}

function InfoButton(props: InfoButtonProps) {
    const { t } = useTranslation();
    const [_, setHovered] = React.useState<boolean>(false);

    return (
        <>
            <Tooltip title={t('Meeting details')} placement="top">
                <Button
                    id="info-button"
                    variant="text"
                    aria-controls={props?.infoDrawerOpen ? 'info-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={props?.infoDrawerOpen ? 'true' : undefined}
                    onClick={() => props?.handleInfoDrawerOpen?.(!props?.infoDrawerOpen)}
                    sx={{ ml: 0.5, px: 1, py: 1.5, minWidth: 'unset' }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    <SvgIcon size={24} viewBox="0 0 500 500" name="info" color="#FFF" />
                </Button>
            </Tooltip>
        </>
    );
}

export default InfoButton;