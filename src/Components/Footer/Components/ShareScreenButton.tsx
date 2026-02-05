import { SvgIcon } from "../../SvgIcon";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
// @ts-ignore
import {CustomizedBtn, rectangularStyle, roundStyle} from '../../CustomizedBtn.tsx';

interface ShareScreenButtonProps {
    footer?: boolean;
    glass?: boolean;
    rounded?: boolean;
    isScreenShared?: boolean;
    handleStartScreenShare?: () => void;
    handleStopScreenShare?: () => void;
}

function ShareScreenButton(props: ShareScreenButtonProps) {
    const { t } = useTranslation();
    const theme = useTheme();

    // Determine icon color based on button state
    const getIconColor = (): string => {
        return theme.palette.themeColor[99]; // Pure white for both states
    };

    // Get button color variant
    const getButtonColor = (): 'primary' | 'secondary' => {
        return props?.isScreenShared ? "primary" : "secondary";
    };

    const handleClick = () => {
        if (props?.isScreenShared) {
            props?.handleStopScreenShare?.();
        } else {
            props?.handleStartScreenShare?.();
            // send other that you are sharing screen.
        }
    };

    return (
        <Tooltip
            title={props?.isScreenShared ? t("You are presenting") : t("Present now")}
            placement="top"
        >
            <CustomizedBtn
                className={props?.footer ? "footer-icon-button" : ""}
                id="share-screen-button"
                glass={props?.glass}
                sx={rectangularStyle}
                onClick={handleClick}
                variant="contained"
                color={getButtonColor()}
            >
                <SvgIcon
                    color={getIconColor()}
                    size={24}
                    viewBox="0 0 500 500"
                    name="share-screen"
                />
            </CustomizedBtn>
        </Tooltip>
    );
}

export default ShareScreenButton;