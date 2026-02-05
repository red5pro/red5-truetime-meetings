import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
// @ts-ignore
import CustomCard from '../CustomCard.tsx';
import { Box } from '@mui/system';

interface OthersCardProps {
    otherParticipantCount: number;
}

function OthersCard(props: OthersCardProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <CustomCard theme={theme}>
            <Box className="others-tile-inner" style={{ background: 'transparent' }}>
                <Typography sx={{ mt: 2, color: "#fff" }}>
                    {props?.otherParticipantCount > 0 ? props?.otherParticipantCount : 0} {props?.otherParticipantCount > 1 ? t("Others") : t("Other")}
                </Typography>
            </Box>
        </CustomCard>
    );
}

export default OthersCard;