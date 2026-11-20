import { Dialog, DialogContent, IconButton, Typography, useTheme, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { themeColors } from 'truetime-ui';
import { getDialogStyle } from '../../../styles/themeUtil';

interface UnauthorizedDialogProps {
  onClose: () => void;
  open: boolean;
  message: string;
}

export function UnauthorizedDialog({ onClose, open, message }: UnauthorizedDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleClose = (): void => {
    onClose();
  };

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { ...getDialogStyle(theme), padding: 0, color: themeColors(theme).text },
      }}
    >
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body1">{t(message)}</Typography>

          <IconButton
            aria-label={t('Close')}
            onClick={onClose}
            sx={{ color: themeColors(theme).mutedText, ml: 2 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
