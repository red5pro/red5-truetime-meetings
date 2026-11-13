import { useTranslation } from 'react-i18next';
import { ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

interface ReactionsButtonProps {
  rounded?: boolean;
  footer?: boolean;
  showEmojis?: boolean;
  setShowEmojis?: (show: boolean) => void;
  glass?: boolean;
}

function ReactionsButton({ showEmojis, setShowEmojis }: ReactionsButtonProps) {
  const { t } = useTranslation();
  return (
    <ToolbarButton
      id="reactions-button"
      icon={<SvgIcon size={24} viewBox="0 0 500 500" name="reaction" color="currentColor" />}
      label={t('Emoji reactions')}
      pressed={Boolean(showEmojis)}
      tone={showEmojis ? 'active' : 'default'}
      onClick={() => setShowEmojis?.(!showEmojis)}
    />
  );
}

export default ReactionsButton;
