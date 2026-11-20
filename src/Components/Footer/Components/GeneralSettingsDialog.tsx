import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { IconButton, MenuItem, useMediaQuery, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { themeColors } from 'truetime-ui';
import { AvailableLanguages } from '../../../constants/AvailableLanguages.js';
import { getDialogStyle } from '../../../styles/themeUtil.js';

interface GeneralSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  currentLanguage: string;
  switchLanguage: (language: string) => void;
  currentTheme: string;
  switchTheme: (theme: string) => void;
}

const TITLE_ID = 'general-settings-dialog-title';

function GeneralSettingsDialog({
  open,
  onClose,
  currentLanguage,
  switchLanguage,
}: GeneralSettingsDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const languageList = Object.keys(AvailableLanguages) as (keyof typeof AvailableLanguages)[];

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    switchLanguage(event.target.value);
  };

  return (
    <Dialog
      onClose={() => onClose()}
      open={open}
      fullScreen={fullScreen}
      maxWidth={'sm'}
      aria-labelledby={TITLE_ID}
      PaperProps={{ sx: getDialogStyle(theme) }}
    >
      <DialogTitle id={TITLE_ID}>
        {t('General Settings')}
        <IconButton
          aria-label={t('Close')}
          onClick={() => onClose()}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 24 },
            top: { xs: 16, sm: 24 },
            color: themeColors(theme).text,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <InputLabel id="language-select-label" sx={{ mb: 1 }}>
          {t('Language')}
        </InputLabel>
        <Select
          fullWidth
          id="language-select"
          labelId="language-select-label"
          variant="outlined"
          value={currentLanguage}
          onChange={handleLanguageChange}
          sx={{ maxWidth: 420 }}
        >
          {languageList.map((lang) => (
            <MenuItem key={lang} value={lang}>
              {AvailableLanguages[lang].name}
            </MenuItem>
          ))}
        </Select>
      </DialogContent>
    </Dialog>
  );
}

export default GeneralSettingsDialog;
