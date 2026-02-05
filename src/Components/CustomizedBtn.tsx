// components/CustomizedBtn.tsx
import { styled, Theme } from "@mui/material/styles";
import Button from "@mui/material/Button";

interface CustomizedBtnProps {
    glass?: boolean;
    overlay?: boolean;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export const CustomizedBtn = styled(Button, {
    shouldForwardProp: (prop: string) => prop !== 'glass' && prop !== 'overlay',
})<CustomizedBtnProps>(({ theme, glass, color = 'primary', overlay = false }: { theme: Theme } & CustomizedBtnProps) => {
    const paletteColor = theme.palette[color]?.main || theme.palette.primary.main;
    const contrastColor = theme.palette.getContrastText(paletteColor);

    // Get hover colors from theme
    const getHoverColor = (): string => {
        switch (color) {
            case 'primary':
                return "#9A9A9A"; // Lighter gray for primary hover
            case 'error':
                return "#E53935"; // Darker red from theme
            case 'secondary':
                return theme.palette.themeColor?.[50] || "#3A3A3A"; // Hover gray
            case 'success':
                return "#388E3C"; // Darker green
            case 'warning':
                return "#F57C00"; // Darker orange
            case 'info':
                return "#1976D2"; // Darker blue for info
            default:
                return theme.palette.action?.hover || "#3A3A3A";
        }
    };

    return {
        // Enhanced contrast for overlay buttons
        ...(overlay && {
            boxShadow: `
        0 4px 16px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 0 0 1px rgba(255, 255, 255, 0.1)
      `,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: `1px solid rgba(255, 255, 255, 0.2)`,
            '&:hover': {
                boxShadow: `
          0 6px 20px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.15)
        `,
                transform: 'translateY(-1px)',
            },
        }),

        // Base hover effect for all buttons
        '&:hover': {
            backgroundColor: getHoverColor(),
            transform: 'scale(1.02)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },

        // Disabled state
        '&.Mui-disabled': {
            backgroundColor: theme.palette.themeColor?.[50] || '#4A4A4A',
            color: theme.palette.themeColor?.[30] || '#8E8E8E',
            opacity: 0.6,
            '&:hover': {
                transform: 'none',
                backgroundColor: theme.palette.themeColor?.[50] || '#4A4A4A',
            },
        },

        '&.footer-icon-button': {
            padding: 0,
            minWidth: 'unset',
            '& > svg': {
                width: 24,
                height: 24,
            },
        },

        ...(glass && {
            position: 'relative',
            overflow: 'hidden',
            background: `${paletteColor}33`, // 20% opacity (hex "33")
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${paletteColor}55`, // subtle border with alpha
            boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        inset 0 -1px 0 rgba(255, 255, 255, 0.05),
        inset 0 0 20px 10px rgba(255, 255, 255, 0.05)
      `,
            color: contrastColor,

            // Glass effect hover
            '&:hover': {
                background: `${paletteColor}44`, // Slightly more opaque on hover
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                transform: 'scale(1.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `
          0 12px 40px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.4),
          inset 0 -1px 0 rgba(255, 255, 255, 0.1),
          inset 0 0 25px 15px rgba(255, 255, 255, 0.08)
        `,
            },

            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
            },
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1px',
                height: '100%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.5), transparent, rgba(255,255,255,0.2))',
            },
        }),
    };
});

export const roundStyle = {
    width: { xs: 46, md: 56 },
    height: { xs: 46, md: 56 },
    minWidth: { xs: 46, md: 56 },
    minHeight: { xs: 46, md: 56 },
    maxWidth: { xs: 46, md: 56 },
    maxHeight: { xs: 46, md: 56 },
    borderRadius: '50%',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
} as const;

export const rectangularStyle = {
    width: { xs: 46, md: 56 },
    height: { xs: 46, md: 56 },
    minWidth: { xs: 46, md: 56 },
    minHeight: { xs: 46, md: 56 },
    maxWidth: { xs: 46, md: 56 },
    maxHeight: { xs: 46, md: 56 },
    borderRadius: '23px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
} as const;