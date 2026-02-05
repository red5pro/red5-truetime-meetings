// components/GlassFab.tsx
import { styled, Theme } from "@mui/material/styles";
import Fab from "@mui/material/Fab";

interface GlassFabProps {
    glass?: boolean;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export const GlassFab = styled(Fab, {
    shouldForwardProp: (prop: string) => prop !== 'glass',
})<GlassFabProps>(({ theme, glass = true, color = 'primary' }: { theme: Theme } & GlassFabProps) => {
    const paletteColor = theme.palette[color]?.main || theme.palette.primary.main;
    const contrastColor = theme.palette.getContrastText(paletteColor);

    return {
        ...(glass && {
            backgroundColor: `${paletteColor}20`, // 12.5% opacity
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${paletteColor}33`,
            boxShadow: `
        0 6px 24px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(255, 255, 255, 0.03),
        inset 0 0 10px 5px rgba(255, 255, 255, 0.08)
      `,
            color: contrastColor,
        }),
    };
});