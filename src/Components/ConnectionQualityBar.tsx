import React from 'react';
import { alpha, styled, Theme } from "@mui/material/styles";
import { Box, Tooltip } from "@mui/material";

interface ConnectionQualityBarProps {
    streamId: string;
    isMine: boolean;
    connectionQuality?: number;
    theme: Theme;
}

const QualityIndicator = styled(Box)(({}: { theme: Theme }) => ({
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 150,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
        transform: 'scale(1.05)',
    }
}));

export const ConnectionQualityBar = React.memo<ConnectionQualityBarProps>(({
                                                                               connectionQuality = 0,
                                                                               theme
                                                                           }) => {
    const getQualityColor = (score: number): string => {
        if (score >= 4.5) return '#4caf50';
        if (score >= 3.5) return '#8bc34a';
        if (score >= 2.5) return '#ffc107';
        if (score >= 1.5) return '#ff9800';
        return '#f44336';
    };

    const color = getQualityColor(connectionQuality);

    const qualityBars = Array.from({ length: 4 }, (_, index) => {
        const isActive = (connectionQuality / 5) * 4 > index;
        return (
            <Box
                key={index}
                sx={{
                    width: 3,
                    height: 4 + (index * 2),
                    backgroundColor: isActive ? color : alpha(color, 0.3),
                    marginLeft: index > 0 ? '1px' : 0,
                    borderRadius: '1px'
                }}
            />
        );
    });

    return (
        <Tooltip
            title={`Connection Quality: ${connectionQuality?.toFixed(1)}/5.0`}
            placement="top"
        >
            <QualityIndicator theme={theme}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'end',
                        padding: '4px 6px',
                        backgroundColor: alpha('#000', 0.7),
                        borderRadius: '6px',
                        backdropFilter: 'blur(4px)',
                        border: `1px solid ${alpha(color, 0.5)}`
                    }}
                >
                    {qualityBars}
                </Box>
            </QualityIndicator>
        </Tooltip>
    );
});

ConnectionQualityBar.displayName = 'ConnectionQualityBar';