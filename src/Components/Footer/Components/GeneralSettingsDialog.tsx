import React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { MenuItem, useMediaQuery, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { SvgIcon } from '../../SvgIcon.tsx';
import { useTranslation } from 'react-i18next';
//import { ThemeList } from "../../../constants/themeList.js";
import { AvailableLanguages } from '../../../constants/AvailableLanguages.js';
import { getDialogStyle } from '../../../styles/themeUtil.js';

interface Red5DialogTitleProps {
  children: React.ReactNode;
  onClose?: () => void;
}

interface GeneralSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  currentLanguage: string;
  switchLanguage: (language: string) => void;
  currentTheme: string;
  switchTheme: (theme: string) => void;
}

const Red5DialogTitle: React.FC<Red5DialogTitleProps> = ({ children, onClose, ...other }) => (
  <DialogTitle {...other}>
    {children}
    {onClose ? (
      <Button
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 26,
          top: 27,
        }}
      >
        <SvgIcon size={20} viewBox="0 0 500 500" name={'close'} color={'#fff'} />
      </Button>
    ) : null}
  </DialogTitle>
);

function GeneralSettingsDialog({
  open,
  onClose,
  currentLanguage,
  switchLanguage,
  //currentTheme,
  //switchTheme,
}: GeneralSettingsDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const languageList = Object.keys(AvailableLanguages);
  //const themeList = Object.keys(ThemeList);

  const handleClose = (_event?: any, _reason?: string) => {
    onClose();
  };

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    switchLanguage(event.target.value);
  };

  /*
    const handleThemeChange = (event: SelectChangeEvent<string>) => {
        switchTheme(event.target.value);
    };

     */

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      fullScreen={fullScreen}
      maxWidth={'sm'}
      PaperProps={{ sx: getDialogStyle(theme) }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(0.5px)',
        },
      }}
    >
      <Red5DialogTitle onClose={handleClose}>{t('General Settings')}</Red5DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <Grid container>
            <Grid size={12}>
              <InputLabel>{t('Language')}</InputLabel>
            </Grid>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={10}>
                <Select
                  fullWidth
                  id="language-select"
                  variant="outlined"
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                  sx={{ color: '#fff' }}
                >
                  {languageList.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {
                        // @ts-expect-error: temporary fix for legacy code
                        AvailableLanguages[lang].name
                      }
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
          </Grid>
          {/*
              <Grid container sx={{ mt: 4 }}>
                <Grid size={12}>
                  <InputLabel>{t('Theme')}</InputLabel>
                </Grid>
                <Grid container spacing={2} sx={{ alignItems: "center" }}>
                  <Grid size={10}>
                    <Select
                      fullWidth
                      id="theme-select"
                      variant="outlined"
                      value={currentTheme}
                      onChange={handleThemeChange}
                      sx={{ color: '#fff' }}
                    >
                      {themeList.map((theme) => (
                        <MenuItem key={theme} value={ThemeList[theme]}>
                          {t(theme)}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>
              </Grid>
            */}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default GeneralSettingsDialog;
