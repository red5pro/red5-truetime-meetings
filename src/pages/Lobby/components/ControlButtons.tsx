import React from 'react';
import { Box } from '@mui/system';
import { useTranslation } from 'react-i18next';
import { isMobile } from 'react-device-detect';
import { ToolbarButton } from 'truetime-ui';
import { ControlButtonsProps } from '../types.ts';
import CameraButton from '../../../Components/Footer/Components/CameraButton.tsx';
import MicButton from '../../../Components/Footer/Components/MicButton.tsx';
import { SvgIcon } from '../../../Components/SvgIcon.tsx';

export const ControlButtons = React.memo<ControlButtonsProps>(
  ({
    isMyCamTurnedOff,
    cameraButtonDisabled,
    handleMuteVideoLobby,
    isMyMicMuted,
    toggleMic,
    microphoneButtonDisabled,
    onVirtualEffectsClick,
  }) => {
    const { t } = useTranslation();

    return (
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <MicButton
          showMicrophoneOptions={false}
          isMicMuted={isMyMicMuted}
          toggleMic={toggleMic}
          microphoneButtonDisabled={microphoneButtonDisabled}
        />
        <CameraButton
          showCameraOptions={false}
          isCamTurnedOff={isMyCamTurnedOff}
          cameraButtonDisabled={cameraButtonDisabled}
          onTurnOffCamera={handleMuteVideoLobby}
          onTurnOnCamera={handleMuteVideoLobby}
        />
        {!isMobile && (
          <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
            <ToolbarButton
              id="lobby-page-virtual-effects"
              icon={
                <SvgIcon
                  size={24}
                  viewBox="0 0 500 500"
                  name="virtual-effects"
                  color="currentColor"
                />
              }
              label={t('Backgrounds and effects')}
              onClick={onVirtualEffectsClick}
            />
          </Box>
        )}
      </Box>
    );
  },
);

ControlButtons.displayName = 'ControlButtons';
