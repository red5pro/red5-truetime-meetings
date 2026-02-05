import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
// @ts-ignore
import {CustomizedBtn, rectangularStyle, roundStyle} from '../../CustomizedBtn.tsx';

interface RaiseHandButtonProps {
    rounded?: boolean;
    footer?: boolean;
    isRaiseHand?: boolean;
    setIsRaiseHand?: (raised: boolean) => void;
    glass?: boolean;
}

function RaiseHandButton(props: RaiseHandButtonProps) {
    const { footer, isRaiseHand, setIsRaiseHand, glass } = props;
    const { t } = useTranslation();
    const theme = useTheme();

    // Determine icon color based on button state
    const getIconColor = (): string => {
        return theme.palette.themeColor[99]; // Pure white for both states
    };

    // Get button color variant
    const getButtonColor = (): 'primary' | 'secondary' => {
        return isRaiseHand ? 'primary' : 'secondary';
    };

    const handleClick = () => {
        setIsRaiseHand?.(!isRaiseHand);
    };

    return (
        <>
            <Tooltip title={t('Raise hand')} placement="top">
                <CustomizedBtn
                    glass={glass}
                    className={footer ? 'footer-icon-button' : ''}
                    variant="contained"
                    color={getButtonColor()}
                    sx={rectangularStyle}
                    onClick={handleClick}
                >
                    <SvgIcon
                        size={24}
                        viewBox="0 0 500 500"
                        name="raise-hand"
                        color={getIconColor()}
                    />
                </CustomizedBtn>
            </Tooltip>
        </>
    );
}

export default RaiseHandButton;