import { useTranslation } from 'react-i18next';
import { ToolbarButton } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon';

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
  const open = Boolean(props.participantListDrawerOpen);
  const count = props.participantCount;

  return (
    <ToolbarButton
      id="participant-list-button"
      icon={<SvgIcon size={24} viewBox="0 0 500 500" name="participants" color="currentColor" />}
      label={count != null ? `${t('Participant List')} (${count})` : t('Participant List')}
      pressed={open}
      tone={open ? 'active' : props.showBackground ? 'default' : 'ghost'}
      onClick={() => props.handleParticipantListOpen?.(!open)}
    >
      {count != null ? <span aria-hidden>{count}</span> : undefined}
    </ToolbarButton>
  );
}

export default ParticipantListButton;
