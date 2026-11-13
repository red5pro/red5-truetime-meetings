import { Badge } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

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
  const open = Boolean(props.messageDrawerOpen);
  const unread = Number.isNaN(props.numberOfUnReadMessages ?? 0)
    ? 0
    : (props.numberOfUnReadMessages ?? 0);

  const handleButtonClick = () => {
    if (!open) {
      props.toggleSetNumberOfUnreadMessages?.(0);
    }
    props.handleMessageDrawerOpen?.(!open);
  };

  return (
    <Badge
      badgeContent={unread}
      color="primary"
      overlap="circular"
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <ToolbarButton
        id="messages-button"
        icon={<SvgIcon size={24} viewBox="0 0 500 500" name="message-off" color="currentColor" />}
        label={unread > 0 ? `${t('Chat with everyone')} (${unread})` : t('Chat with everyone')}
        pressed={open}
        tone={open ? 'active' : props.showBackground ? 'default' : 'ghost'}
        onClick={handleButtonClick}
      />
    </Badge>
  );
}

export default MessageButton;
