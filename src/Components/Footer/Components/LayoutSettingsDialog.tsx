import * as React from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';

import { useTranslation } from 'react-i18next';
import { SvgIcon } from '../../SvgIcon.js';
//import debounce from 'lodash/debounce'
import { getDialogStyle } from '../../../styles/themeUtil.js';
// @ts-ignore
import { LayoutOptions } from '../../../utils/layoutOptions.ts';

interface Red5DialogTitleProps {
  children: React.ReactNode;
  onClose?: () => void;
}

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

/*
const CustomizedSlider = styled(Slider)(({ theme }) => ({
    marginBottom: 0,

    '&.MuiSlider-dragging .MuiSlider-thumb': {
        boxShadow: `0px 0px 0px 10px ${alpha(theme.palette.primary.main, 0.3)}`
    },
    '& div[class*="MuiAvatar-root-MuiAvatarGroup-avatar"]': {
        [theme.breakpoints.down('md')]: {
            width: 44,
            height: 44,
            fontSize: 16
        }
    }
}))
 */

const Red5DialogTitle: React.FC<Red5DialogTitleProps> = (props) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle {...other}>
      {children}
      {onClose ? (
        <Button
          aria-label="close"
          onClick={onClose}
          id="layout-dialog-close-button"
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
};

export function LayoutSettingsDialog(props: LayoutSettingsDialogProps) {
  const { t } = useTranslation();

  /*
    const [value, setValue] = React.useState<number>(
        props?.globals?.desiredTileCount || 6
    )

     */

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const handleClose = (): void => {
    props?.onClose?.(props?.selectedValue);
  };

  const changeLayout = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const mode = event.target.value;
    props?.changeLayout?.(mode);
  };

  const radioLabel = (label: string, icon: string): React.ReactElement => {
    return (
      <Grid
        container
        style={{ width: '100%' }}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Grid>
          <Typography color="#fff">{label}</Typography>
        </Grid>
        <Grid
          sx={{
            pr: 0.5,
            pl: 0.5,
            pt: 1.5,
            pb: 1.5,
            borderRadius: 4,
          }}
        >
          <SvgIcon size={24} viewBox="0 0 500 500" name={icon} color={'#fff'} />
        </Grid>
      </Grid>
    );
  };

  /*
    const handleMaxVideoTrackCountChange = (count: number): void => {
        //props?.handleSetDesiredTileCount?.(count)
    }

    const debouncedHandleMaxVideoTrackCountChange = debounce(
        handleMaxVideoTrackCountChange,
        500
    )


    const handleSliderChange = (event: Event, newValue: number | number[]): void => {
        const sliderValue = Array.isArray(newValue) ? newValue[0] : newValue
        setValue(sliderValue)
        if (sliderValue !== value) {
            debouncedHandleMaxVideoTrackCountChange(sliderValue)
        }
    }
     */

  return (
    <Dialog
      onClose={handleClose}
      open={props?.open || false}
      fullScreen={fullScreen}
      maxWidth={'xs'}
      PaperProps={{ sx: getDialogStyle(theme) }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(0.5px)',
        },
      }}
    >
      <Red5DialogTitle onClose={handleClose}>{t('Change Layout')}</Red5DialogTitle>
      <DialogContent sx={{ px: 1 }}>
        <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <Grid container>
            <FormControl sx={{ width: '100%' }}>
              <RadioGroup
                aria-labelledby="layout-radio-buttons"
                defaultValue={LayoutOptions.Auto}
                value={props?.layout}
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
                <FormControlLabel
                  classes={{ label: 'layout-radio-label' }}
                  sx={{ width: '100%' }}
                  value={LayoutOptions.Sidebar}
                  control={<Radio />}
                  label={radioLabel(t('Sidebar'), LayoutOptions.Sidebar)}
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          {/*
                <Typography color="#fff" sx={{fontWeight: 600, mt: 2.5}}>
                {t('Tiles')}
            </Typography>
                <Typography variant="body2" color="#fff" sx={{mb: 2}}>
            {t('Maximum tiles to display, depending on window size.')}
        </Typography>
          <Grid
              container
              spacing={5}
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
              <Grid>
                  <SvgIcon
                      size={24}
                      viewBox="0 0 500 500"
                      name={'tiles-2x2'}
                      color={'#cacaca'}
                  />
              </Grid>
              <Grid size="grow">
                  <CustomizedSlider
                      value={value}
                      aria-label="video track count"
                      valueLabelDisplay="auto"
                      id="tile-count-slider"
                      defaultValue={value}
                      step={null}
                      min={6}
                      max={42}
                      marks={[
                          {
                              value: 6
                          },
                          {
                              value: 9
                          },
                          {
                              value: 16
                          },
                          {
                              value: 30
                          },
                          {
                              value: 42
                          },
                          {
                              value: 49
                          }
                      ]}
                      onChange={handleSliderChange}
                  />
              </Grid>
              <Grid>
                  <SvgIcon
                      size={24}
                      viewBox="0 0 500 500"
                      name={'tiles-3x3'}
                      color={'#cacaca'}
                  />
              </Grid>
          </Grid>
          */}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
