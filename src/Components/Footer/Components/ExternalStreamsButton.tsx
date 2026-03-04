import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ExternalStreamsButtonProps {
    open?: boolean;
    onClick?: (open: boolean) => void;
}

function ExternalStreamsButton(props: ExternalStreamsButtonProps) {
    const { t } = useTranslation();

    return (
        <Tooltip title={t('External Streams')} placement="top">
            <Box>
                <Button
                    id="external-streams-button"
                    variant="text"
                    onClick={() => props?.onClick?.(!props?.open)}
                    sx={{ ml: 0.5, px: 1, py: 1.5, minWidth: 'unset' }}
                >
                    <SvgIcon
                        size={24}
                        viewBox="0 0 512 512"
                        name="database"
                        color={props.open ? "#24FF00" : "#FFF"}
                    />
                </Button>
            </Box>
        </Tooltip>
    );
}

export default ExternalStreamsButton;
