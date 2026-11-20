import { JSX } from 'react';
import IconButton from '@mui/material/IconButton';
import { Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { themeColors } from 'truetime-ui';

interface DrawerButtonProps {
  handleInfoDrawerOpen?: (open: boolean) => void;
  handleMessageDrawerOpen?: (open: boolean) => void;
  handleParticipantListOpen?: (open: boolean) => void;
  handleEffectsOpen?: (open: boolean) => void;
  handleLocalRecordingDrawerOpen?: (open: boolean) => void;
  handleTranscriptionDrawerOpen?: (open: boolean) => void;
  handleExternalStreamsDrawerOpen?: (open: boolean) => void;
}

/** The close button in a drawer's header; closes whichever drawers it's given. */
function DrawerButton(props: DrawerButtonProps): JSX.Element {
  const { t } = useTranslation();

  const handleCloseAllDrawers = (): void => {
    props?.handleInfoDrawerOpen?.(false);
    props?.handleMessageDrawerOpen?.(false);
    props?.handleParticipantListOpen?.(false);
    props?.handleEffectsOpen?.(false);
    props?.handleLocalRecordingDrawerOpen?.(false);
    props?.handleTranscriptionDrawerOpen?.(false);
    props?.handleExternalStreamsDrawerOpen?.(false);
  };

  return (
    <IconButton
      aria-label={t('Close')}
      onClick={handleCloseAllDrawers}
      sx={(theme) => ({ color: themeColors(theme).text })}
    >
      <Close fontSize="small" />
    </IconButton>
  );
}

export default DrawerButton;
