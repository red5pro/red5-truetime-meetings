import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
// @ts-ignore
import {CustomizedBtn, rectangularStyle, roundStyle} from '../../CustomizedBtn.tsx';

interface ReactionsButtonProps {
    rounded?: boolean;
    footer?: boolean;
    showEmojis?: boolean;
    setShowEmojis?: (show: boolean) => void;
    glass?: boolean;
}

function ReactionsButton(props: ReactionsButtonProps) {
    const { footer, showEmojis, setShowEmojis, glass } = props;
    const { t } = useTranslation();
    const theme = useTheme();

    // Determine icon color based on the button state
    const getIconColor = (): string => {
        return theme.palette.themeColor[99]; // Pure white for both states
    };

    // Get button color variant
    const getButtonColor = (): 'primary' | 'secondary' => {
        return showEmojis ? 'primary' : 'secondary';
    };

    const handleClick = () => {
        setShowEmojis?.(!showEmojis);
    };

    return (
        <>
            <Tooltip title={t('Emoji reactions')} placement="top">
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
                        name="reaction"
                        color={getIconColor()}
                    />
                </CustomizedBtn>
            </Tooltip>
        </>
    );
}

export default ReactionsButton;