import { useTranslation } from 'react-i18next';
import { ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

interface RaiseHandButtonProps {
  rounded?: boolean;
  footer?: boolean;
  isRaiseHand?: boolean;
  setIsRaiseHand?: (raised: boolean) => void;
  glass?: boolean;
}

function RaiseHandButton({ isRaiseHand, setIsRaiseHand }: RaiseHandButtonProps) {
  const { t } = useTranslation();
  return (
    <ToolbarButton
      id="raise-hand-button"
      icon={<SvgIcon size={24} viewBox="0 0 500 500" name="raise-hand" color="currentColor" />}
      label={t(isRaiseHand ? 'Lower hand' : 'Raise hand')}
      pressed={Boolean(isRaiseHand)}
      tone={isRaiseHand ? 'active' : 'default'}
      onClick={() => setIsRaiseHand?.(!isRaiseHand)}
    />
  );
}

export default RaiseHandButton;
