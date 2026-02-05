import React from 'react';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import { CustomizedBtn, roundStyle } from '../../CustomizedBtn.tsx';
import Button from '@mui/material/Button';

interface ParticipantListButtonProps {
    showBackground?: boolean;
    glass?: boolean;
    footer?: boolean;
    rounded?: boolean;
    participantListDrawerOpen?: boolean;
    handleParticipantListOpen?: (open: boolean) => void;
    participantCount?: number;
}

function ParticipantListButton(props: ParticipantListButtonProps) {
    const { t } = useTranslation();
    const [_, setHovered] = React.useState<boolean>(false);

    const handleButtonClick = () => {
        props?.handleParticipantListOpen?.(!props?.participantListDrawerOpen);
    };

    return (
        <Tooltip title={t('Participant List')} placement="top">
            {props?.showBackground ? (
                <CustomizedBtn
                    onClick={handleButtonClick}
                    id="participant-list-button"
                    variant="contained"
                    glass={props?.glass}
                    sx={roundStyle}
                    className={props?.footer ? 'footer-icon-button' : ''}
                    color={props?.participantListDrawerOpen ? 'primary' : 'secondary'}
                >
                    <SvgIcon size={24} viewBox="0 0 500 500" color="#FFF" name="participants" />
                    <span style={{ color: '#FFF' }}>{props?.participantCount}</span>
                </CustomizedBtn>
            ) : (
                <Button
                    id="participant-list-button"
                    variant="text"
                    aria-controls={props?.participantListDrawerOpen ? 'participant-list-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={props?.participantListDrawerOpen ? 'true' : undefined}
                    onClick={handleButtonClick}
                    sx={{ ml: 0.5, px: 1, py: 1.5, minWidth: 'unset' }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    <SvgIcon size={24} viewBox="0 0 500 500" color="#FFF" name="participants" />
                    <span style={{ color: '#FFF' }}>{props?.participantCount}</span>
                </Button>
            )}
        </Tooltip>
    );
}

export default ParticipantListButton;