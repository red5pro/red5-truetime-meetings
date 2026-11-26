import * as React from 'react';

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { themeColors } from 'truetime-ui';
import { SvgIcon } from '../../SvgIcon.js';
import { getDialogStyle } from '../../../styles/themeUtil.js';
import { LayoutOptions } from '../../../utils/layoutOptions.ts';

interface LayoutSettingsDialogProps {
  open?: boolean;
  onClose?: (selectedValue?: any) => void;
  selectedValue?: any;
  globals?: {
    desiredTileCount: number;
  };
  layout?: string;
  changeLayout?: (mode: string) => void;
  handleSetDesiredTileCount?: (count: number) => void;
}

const TITLE_ID = 'layout-dialog-title';

export function LayoutSettingsDialog(props: LayoutSettingsDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const handleClose = (): void => {
    props?.onClose?.(props?.selectedValue);
  };

  const changeLayout = (event: React.ChangeEvent<HTMLInputElement>): void => {
    props?.changeLayout?.(event.target.value);
  };

  // Label with the layout's icon at the far end
  const radioLabel = (label: string, icon: string): React.ReactElement => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography>{label}</Typography>
      <Box aria-hidden sx={{ display: 'flex', px: 0.5, py: 1.5 }}>
        <SvgIcon size={24} viewBox="0 0 500 500" name={icon} color={themeColors(theme).text} />
      </Box>
    </Box>
  );

  return (
    <Dialog
      onClose={handleClose}
      open={props?.open || false}
      fullScreen={fullScreen}
      maxWidth={'xs'}
      aria-labelledby={TITLE_ID}
      PaperProps={{ sx: getDialogStyle(theme) }}
    >
      <DialogTitle id={TITLE_ID}>
        {t('Change Layout')}
        <IconButton
          aria-label={t('Close')}
          onClick={handleClose}
          id="layout-dialog-close-button"
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
      <DialogContent sx={{ px: 1 }}>
        <FormControl sx={{ width: '100%' }}>
          <RadioGroup
            aria-labelledby={TITLE_ID}
            value={props?.layout ?? LayoutOptions.Tiled}
            onChange={changeLayout}
            name="layout-radio-buttons-group"
          >
            <FormControlLabel
              classes={{ label: 'layout-radio-label' }}
              sx={{ width: '100%', pb: 1 }}
              value={LayoutOptions.Auto}
              control={<Radio />}
              label={radioLabel(t('Auto'), LayoutOptions.Auto)}
            />
            <FormControlLabel
              classes={{ label: 'layout-radio-label' }}
              sx={{ width: '100%', pb: 1 }}
              value={LayoutOptions.Tiled}
              control={<Radio />}
              label={radioLabel(t('Tiled'), LayoutOptions.Tiled)}
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>
    </Dialog>
  );
}
