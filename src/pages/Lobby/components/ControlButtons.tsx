import React from "react";
import {ControlButtonsProps} from "../types.ts";
import {useTranslation} from "react-i18next";
import {Box} from "@mui/system";
import CameraButton from "../../../Components/Footer/Components/CameraButton.tsx";
import MicButton from "../../../Components/Footer/Components/MicButton.tsx";
import {Tooltip} from "@mui/material";
import {CustomizedBtn, rectangularStyle} from "../../../Components/CustomizedBtn.tsx";
import {SvgIcon} from "../../../Components/SvgIcon.tsx";

export const ControlButtons = React.memo<ControlButtonsProps>(({
                                                            glass,
                                                            isMyCamTurnedOff,
                                                            cameraButtonDisabled,
                                                            handleMuteVideoLobby,
                                                            isMyMicMuted,
                                                            toggleMic,
                                                            microphoneButtonDisabled,
                                                            onVirtualEffectsClick
                                                        }) => {
    const { t } = useTranslation()

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
                gap: 2
            }}
        >
            <CameraButton
                glass={glass}
                showCameraOptions={false}
                rounded
                footer={false}
                isCamTurnedOff={isMyCamTurnedOff}
                cameraButtonDisabled={cameraButtonDisabled}
                onTurnOffCamera={handleMuteVideoLobby}
                onTurnOnCamera={handleMuteVideoLobby}
            />
            <MicButton
                glass={glass}
                showMicrophoneOptions={false}
                rounded
                footer={false}
                isMicMuted={isMyMicMuted}
                toggleMic={toggleMic}
                microphoneButtonDisabled={microphoneButtonDisabled}
            />
            <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                <Tooltip title={t('Virtual Effects')} placement="top">
                    <CustomizedBtn
                        glass={glass}
                        variant="contained"
                        color="secondary"
                        sx={rectangularStyle}
                        onClick={onVirtualEffectsClick}
                        id="lobby-page-virtual-effects"
                    >
                        <SvgIcon size={24} viewBox="0 0 500 500" name="virtual-effects" color="#FFF" />
                    </CustomizedBtn>
                </Tooltip>
            </Box>
        </Box>
    )
})

ControlButtons.displayName = 'ControlButtons'