import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface EndCallConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
}

const EndCallConfirmationDialog: React.FC<EndCallConfirmationDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{t('Wait for Recording Upload')}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {t('Wait local recordings uploading before closing the meeting')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          {t('Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EndCallConfirmationDialog;
