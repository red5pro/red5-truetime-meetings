import { useTranslation } from 'react-i18next';
import { ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

interface InfoButtonProps {
  infoDrawerOpen?: boolean;
  handleInfoDrawerOpen?: (open: boolean) => void;
}

function InfoButton(props: InfoButtonProps) {
  const { t } = useTranslation();
  return (
    <ToolbarButton
      id="info-button"
      icon={<SvgIcon size={24} viewBox="0 0 500 500" name="info" color="currentColor" />}
      label={t('Meeting details')}
      pressed={Boolean(props.infoDrawerOpen)}
      tone={props.infoDrawerOpen ? 'active' : 'ghost'}
      onClick={() => props.handleInfoDrawerOpen?.(!props.infoDrawerOpen)}
    />
  );
}

export default InfoButton;
