import React, { ReactNode } from 'react';
import Grid from '@mui/material/Grid2';
import { Theme } from '@mui/material/styles';

interface CustomCardProps {
  children?: ReactNode;
  theme?: Theme;
  variant?: 'default' | 'primary' | 'secondary' | 'subtle';
  glass?: boolean;
  hasOverlayButtons?: boolean;
}

interface ThemeColors {
  dark1: string;
  dark2: string;
  dark3: string;
  dark4: string;
}

const CustomCard: React.FC<CustomCardProps> = ({
  children,
  theme,
  variant = 'default',
  glass = false,
  hasOverlayButtons = false,
}) => {
  // Get refined theme colors with fallbacks
  const getCardBackground = (): string => {
    // If buttons will be overlaid, use darker backgrounds for better contrast
    const baseColors: ThemeColors = hasOverlayButtons
      ? {
          dark1: theme?.palette?.themeColor?.[85] || '#0F0F0F',
          dark2: theme?.palette?.themeColor?.[80] || '#141414',
          dark3: theme?.palette?.themeColor?.[75] || '#1A1A1A',
          dark4: theme?.palette?.themeColor?.[70] || '#2C2C2C',
        }
      : {
          dark1: theme?.palette?.themeColor?.[72] || '#1E1E1E',
          dark2: theme?.palette?.themeColor?.[70] || '#2C2C2C',
          dark3: theme?.palette?.themeColor?.[60] || '#353535',
          dark4: theme?.palette?.themeColor?.[60] || '#3A3A3A',
        };

    switch (variant) {
      case 'primary':
        return `linear-gradient(135deg, 
          ${baseColors.dark1} 0%, 
          ${baseColors.dark2} 50%, 
          ${baseColors.dark3} 100%)`;
      case 'secondary':
        return `linear-gradient(135deg, 
          ${baseColors.dark1} 0%, 
          ${baseColors.dark2} 50%, 
          ${baseColors.dark3} 100%)`;
      case 'subtle':
        return `linear-gradient(135deg, 
          ${baseColors.dark2} 0%, 
          ${baseColors.dark3} 100%)`;
      default:
        return `linear-gradient(135deg, 
          ${baseColors.dark1} 0%, 
          ${baseColors.dark2} 30%, 
          ${baseColors.dark3} 70%, 
          ${baseColors.dark4} 100%)`;
    }
  };

  const getBorderColor = (): string => {
    return theme?.palette?.themeColor?.[50] || '#4A4A4A';
  };

  const getHighlightColor = (): string => {
    return theme?.palette?.themeColor?.[99] || '#FFFFFF';
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        background: getCardBackground(),
        border: `1px solid ${getBorderColor()}`,
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 rgba(255, 255, 255, 0.05)
        `,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

        // Glass effect overlay if enabled
        ...(glass && {
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: hasOverlayButtons
            ? `linear-gradient(135deg, 
                ${theme?.palette?.themeColor?.[85] || '#0F0F0F'}CC 0%, 
                ${theme?.palette?.themeColor?.[80] || '#141414'}AA 50%, 
                ${theme?.palette?.themeColor?.[75] || '#1A1A1A'}CC 100%)`
            : `linear-gradient(135deg, 
                ${theme?.palette?.themeColor?.[72] || '#1E1E1E'}CC 0%, 
                ${theme?.palette?.themeColor?.[70] || '#2C2C2C'}AA 50%, 
                ${theme?.palette?.themeColor?.[60] || '#353535'}CC 100%)`,
        }),

        // Enhanced contrast for overlay buttons
        ...(hasOverlayButtons && {
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at center, 
              transparent 0%, 
              ${theme?.palette?.themeColor?.[90] || '#0A0A0A'}20 100%)`,
            pointerEvents: 'none',
            zIndex: 0,
          },
          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
        }),

        // Hover effects
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(255, 255, 255, 0.08)
          `,
          border: `1px solid ${theme?.palette?.themeColor?.[40] || '#6E6E6E'}`,
        },

        // Top highlight line
        '&::before': !hasOverlayButtons
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '1px',
              background: `linear-gradient(90deg, 
            transparent 0%, 
            ${getHighlightColor()}40 20%, 
            ${getHighlightColor()}60 50%, 
            ${getHighlightColor()}40 80%, 
            transparent 100%)`,
              borderRadius: '0 0 1px 1px',
            }
          : undefined,

        // Combined pseudo-element for left highlight and inner shadow
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(180deg, 
              transparent 0%, 
              transparent 10%,
              ${getHighlightColor()}30 20%, 
              ${getHighlightColor()}50 50%, 
              ${getHighlightColor()}30 80%, 
              transparent 90%,
              transparent 100%) left/1px 100% no-repeat,
            radial-gradient(circle at 30% 20%, 
              ${getHighlightColor()}08 0%, 
              transparent 50%)
          `,
          pointerEvents: 'none',
          borderRadius: '0 1px 1px 0',
        },
      }}
    >
      {children}
    </Grid>
  );
};

export default CustomCard;
