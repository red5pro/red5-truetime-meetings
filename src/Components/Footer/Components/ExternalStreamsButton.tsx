import { useTranslation } from 'react-i18next';
import { ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';
import { getRuntimeConfig } from '../../../utils/configStore';

interface ExternalStreamsButtonProps {
  open?: boolean;
  onClick?: (open: boolean) => void;
}

function ExternalStreamsButton(props: ExternalStreamsButtonProps) {
  const { t } = useTranslation();
  const isExternalStreamsEnabled = getRuntimeConfig().VITE_ENABLE_EXTERNAL_STREAMS === 'true';

  return (
    <ToolbarButton
      id="external-streams-button"
      icon={<SvgIcon size={24} viewBox="0 0 512 512" name="database" color="currentColor" />}
      label={
        isExternalStreamsEnabled
          ? t('External Streams')
          : t('Upgrade your plan to support external streams')
      }
      pressed={Boolean(props.open)}
      tone={props.open ? 'active' : 'ghost'}
      disabled={!isExternalStreamsEnabled}
      onClick={() => props.onClick?.(!props.open)}
    />
  );
}

export default ExternalStreamsButton;
