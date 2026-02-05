import React from 'react';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip, Badge } from '@mui/material';
import { useTranslation } from 'react-i18next';
//@ts-ignore
import { CustomizedBtn, roundStyle } from '../../CustomizedBtn.tsx';
import Button from '@mui/material/Button';

interface MessageButtonProps {
    numberOfUnReadMessages?: number;
    messageDrawerOpen?: boolean;
    handleMessageDrawerOpen?: (open: boolean) => void;
    toggleSetNumberOfUnreadMessages?: (count: number) => void;
    showBackground?: boolean;
    glass?: boolean;
    footer?: boolean;
    rounded?: boolean;
}

function MessageButton(props: MessageButtonProps) {
    const { t } = useTranslation();
    const [_, setHovered] = React.useState<boolean>(false);

    const handleButtonClick = () => {
        if (!props?.messageDrawerOpen) {
            props?.toggleSetNumberOfUnreadMessages?.(0);
        }
        props?.handleMessageDrawerOpen?.(!props?.messageDrawerOpen);
    };

    return (
        <Badge
            badgeContent={isNaN(props?.numberOfUnReadMessages || 0) ? 0 : (props?.numberOfUnReadMessages || 0)}
            color="primary"
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            style={{ height: '100%', width: '100%' }}
        >
            <Tooltip title={t('Chat with everyone')} placement="top">
                {props?.showBackground ? (
                    <CustomizedBtn
                        onClick={handleButtonClick}
                        variant="contained"
                        glass={props?.glass}
                        className={props?.footer ? 'footer-icon-button' : ''}
                        sx={roundStyle}
                        color={props?.messageDrawerOpen ? 'primary' : 'secondary'}
                        id="messages-button"
                    >
                        <SvgIcon size={24} viewBox="0 0 500 500" color="#FFF" name="message-off" />
                    </CustomizedBtn>
                ) : (
                    <Button
                        id="messages-button"
                        variant="text"
                        aria-controls={props?.messageDrawerOpen ? 'messages-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={props?.messageDrawerOpen ? 'true' : undefined}
                        onClick={handleButtonClick}
                        sx={{ ml: 0.5, px: 1, py: 1.5, minWidth: 'unset' }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    >
                        <SvgIcon size={24} viewBox="0 0 500 500" color="#FFF" name="message-off" />
                    </Button>
                )}
            </Tooltip>
        </Badge>
    );
}

export default MessageButton;