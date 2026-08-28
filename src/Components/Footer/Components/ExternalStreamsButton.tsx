import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getRuntimeConfig } from '../../../utils/configStore';

interface ExternalStreamsButtonProps {
  open?: boolean;
  onClick?: (open: boolean) => void;
}

function ExternalStreamsButton(props: ExternalStreamsButtonProps) {
  const { t } = useTranslation();
  const isExternalStreamsEnabled = getRuntimeConfig().VITE_ENABLE_EXTERNAL_STREAMS === 'true';

  return (
    <Tooltip
      title={
        isExternalStreamsEnabled
          ? t('External Streams')
          : t('Upgrade your plan to support external streams')
      }
      placement="top"
    >
      <Box>
        <Button
          id="external-streams-button"
          variant="text"
          onClick={() => props?.onClick?.(!props?.open)}
          disabled={!isExternalStreamsEnabled}
          sx={{ ml: 0.5, px: 1, py: 1.5, minWidth: 'unset' }}
        >
          <SvgIcon
            size={24}
            viewBox="0 0 512 512"
            name="database"
            color={props.open ? '#24FF00' : isExternalStreamsEnabled ? '#FFF' : '#666'}
          />
        </Button>
      </Box>
    </Tooltip>
  );
}

export default ExternalStreamsButton;
