import React from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LocalRecordingButtonProps {
  open?: boolean;
  onClick?: (open: boolean) => void;
  isActive?: boolean;
}

function LocalRecordingButton(props: LocalRecordingButtonProps) {
  const { t } = useTranslation();
  const [_, setHovered] = React.useState<boolean>(false);

  return (
    <Tooltip title={t('Local Recording Status')} placement="top">
      <Box sx={{ position: 'relative' }}>
        <Button
          id="local-recording-button"
          variant="text"
          onClick={() => props?.onClick?.(!props?.open)}
          sx={{ ml: 0.5, px: 1, py: 1.5, minWidth: 'unset' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <SvgIcon
            size={24}
            viewBox="0 0 500 500"
            name="camera"
            color={props.isActive ? '#FF4D4D' : '#FFF'}
          />
        </Button>
        {props.isActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 5,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#FF4D4D',
              border: '2px solid #000',
              animation: 'pulse 1.5s infinite',
            }}
          />
        )}
        <style>
          {`
                        @keyframes pulse {
                            0% { transform: scale(0.95); opacity: 0.8; }
                            50% { transform: scale(1.1); opacity: 1; }
                            100% { transform: scale(0.95); opacity: 0.8; }
                        }
                    `}
        </style>
      </Box>
    </Tooltip>
  );
}

export default LocalRecordingButton;
