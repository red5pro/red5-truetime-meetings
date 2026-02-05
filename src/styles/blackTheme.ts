import { createTheme, Theme } from '@mui/material/styles';
import ClashDisplayRegular from "../static/Fonts/WEB/fonts/ClashDisplay-Regular.ttf";
import ClashDisplayMedium from "../static/Fonts/WEB/fonts/ClashDisplay-Medium.ttf";
import ClashDisplaySemiBold from "../static/Fonts/WEB/fonts/ClashDisplay-Semibold.ttf";
import ClashDisplayBold from "../static/Fonts/WEB/fonts/ClashDisplay-Bold.ttf";

// Extend MUI Theme interface to include custom palette properties
declare module '@mui/material/styles' {
    interface Palette {
        themeColor: {
            0: string;
            10: string;
            20: string;
            30: string;
            40: string;
            50: string;
            60: string;
            70: string;
            71: string;
            72: string;
            75: string;
            80: string;
            85: string;
            90: string;
            99: string;
        };
        gray: {
            90: string;
        };
        textColor: string;
        chatText: string;
        participantListIcon: {
            primary: string;
            default: string;
            secondary: string;
        };
        iconColor: {
            primary: string;
            default: string;
            secondary: string;
        };
        darkIconColor: {
            primary: string;
            default: string;
            secondary: string;
        };
    }

    interface PaletteOptions {
        themeColor?: {
            0?: string;
            10?: string;
            20?: string;
            30?: string;
            40?: string;
            50?: string;
            60?: string;
            70?: string;
            71?: string;
            72?: string;
            75?: string;
            80?: string;
            85?: string;
            90?: string;
            99?: string;
        };
        gray?: {
            90?: string;
        };
        textColor: string;
        chatText: string;
        participantListIcon?: {
            primary?: string;
            default?: string;
            secondary?: string;
        };
        iconColor?: {
            primary?: string;
            default?: string;
            secondary?: string;
        };
        darkIconColor?: {
            primary?: string;
            default?: string;
            secondary?: string;
        };
    }

    interface TypeBackground {
        level1: string;
        level2: string;
    }
}

interface ThemeColors {
    themeColor0: string;
    themeColor10: string;
    themeColor20: string;
    themeColor30: string;
    themeColor40: string;
    themeColor50: string;
    themeColor60: string;
    themeColor70: string;
    themeColor71: string;
    themeColor72: string;
    themeColor75: string;
    themeColor80: string;
    themeColor85: string;
    themeColor90: string;
    themeColor99: string;
    textColor: string;
    chatText: string;
    secondaryText: string;
    iconColor: string;
    darkIconColor: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    primaryColor: string;
    secondaryColor: string;
    hoverColor: string;
    activeColor: string;
    focusColor: string;
}

export function getBlackTheme(): Theme {
    // Refined Dark Theme Color Palette
    const colors: ThemeColors = {
        themeColor0: "#F5F5F5",    // Lightest - for backgrounds that need high contrast
        themeColor10: "#E0E0E0",   // Very light gray - subtle borders, disabled states
        themeColor20: "#B8B8B8",   // Light gray - secondary text, placeholders
        themeColor30: "#8E8E8E",   // Medium gray - icons, less important text
        themeColor40: "#6E6E6E",   // Active secondary elements
        themeColor50: "#4A4A4A",   // Darker gray - borders, dividers
        themeColor60: "#393737",   // Card backgrounds, panels
        themeColor70: "#2C2C2C",   // Dark backgrounds - modals, dropdowns
        themeColor71: "#242424",   // Slightly darker variation
        themeColor72: "#1E1E1E",   // Darker variation - sidebar backgrounds
        themeColor75: "#1A1A1A",   // Very dark - main backgrounds
        themeColor80: "#141414",   // Almost black - deep backgrounds
        themeColor85: "#0F0F0F",   // Near black - footer, header backgrounds
        themeColor90: "#0A0A0A",   // Very deep black
        themeColor99: "#FFFFFF",   // Pure white - primary text, icons

        // Text & Icon Colors
        textColor: "#FAFAFA",       // Slightly off-white for better readability
        chatText: "#FAFAFA",       // Slightly off-white for better readability
        secondaryText: "#B8B8B8",  // Light gray for secondary text
        iconColor: "#FFFFFF",      // White icons for dark backgrounds
        darkIconColor: "#6E6E6E",  // Dark icons for light backgrounds

        // Functional Colors
        error: "#FF4444",          // Softer red, better for dark themes
        warning: "#FFB74D",        // Warm orange for warnings
        success: "#81C784",        // Soft green for success states
        info: "#64B5F6",           // Light blue for info states

        // Primary & Secondary Colors
        primaryColor: "#8A8A8A",   // Medium gray accent - subtle and elegant
        secondaryColor: "#393737", // Card/panel background color

        // Interactive States
        hoverColor: "#9A9A9A",     // Slightly lighter gray for hover
        activeColor: "#7A7A7A",    // Slightly darker gray for pressed/active states
        focusColor: "#8A8A8A",     // Gray focus ring
    };

    const themeConfig = createTheme({
        typography: {
            allVariants: {
                color: "#FFFFFF",
                fontFamily: 'ClashDisplay !important',
            },
            h1: {
                fontFamily: 'ClashDisplay !important',
                fontSize: 56,
                fontWeight: 700,
            },
            h2: {
                fontWeight: 700,
            },
            h3: {
                fontWeight: 700,
            },
            h5: {
                fontSize: 40,
                letterSpacing: "-0.007em",
            },
            h6: {
                fontSize: 20,
                lineHeight: 1,
                fontWeight: 500,
            },
            body1: {
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.2,
                color: "#FFFFFF",
            },
            body2: {
                fontSize: 14,
                lineHeight: 1.2,
                color: colors.secondaryText,
            },
        },
        components: {
            MuiSelect: {
                styleOverrides: {
                    root: {
                        fontFamily: 'ClashDisplay !important',
                        "& fieldset": {
                            borderColor: colors.themeColor40,
                        },
                    },
                    icon: {
                        color: colors.iconColor,
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        fontFamily: 'ClashDisplay !important',
                        padding: 8,
                        "&:hover": {
                            backgroundColor: colors.hoverColor,
                        },
                    },
                },
            },
            MuiFab: {
                styleOverrides: {
                    root: {
                        fontFamily: 'ClashDisplay !important',
                        boxShadow: "unset",
                        "&:hover": {
                            backgroundColor: colors.hoverColor,
                        },
                    },
                },
            },
            MuiList: {
                styleOverrides: {
                    root: {
                        fontFamily: 'ClashDisplay !important',
                        background: colors.themeColor70,
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        fontFamily: 'ClashDisplay!important',
                        padding: "12px 40px 32px",
                        width: "100%",
                        backgroundColor: colors.themeColor75,
                    },
                },
            },
            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        fontFamily: 'ClashDisplay!important',
                        color: colors.themeColor99,
                        padding: "24px 0",
                        fontSize: 24,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        fontFamily: 'ClashDisplay !important',
                        borderRadius: 6,
                        background: colors.themeColor72,
                    },
                },
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: {
                        fontFamily: 'ClashDisplay !important',
                        paddingTop: 16,
                        paddingBottom: 16,
                        color: colors.themeColor99,
                        "&:hover": {
                            backgroundColor: colors.hoverColor,
                        },
                    },
                },
            },
            MuiListItemIcon: {
                styleOverrides: {
                    root: {
                        fontFamily: 'ClashDisplay !important',
                        marginRight: 16,
                    },
                },
            },
            MuiListItemText: {
                styleOverrides: {
                    primary: {
                        color: colors.themeColor99,
                    },
                    secondary: {
                        color: colors.secondaryText,
                    },
                    root: {
                        fontFamily: 'ClashDisplay !important',
                    }
                },
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: {
                        color: colors.secondaryText,
                        fontSize: 14,
                        marginBottom: 4,
                        fontFamily: 'ClashDisplay !important',
                    },
                },
            },
            MuiDialogContent: {
                styleOverrides: {
                    root: {
                        color: colors.themeColor99,
                        paddingLeft: 0,
                        paddingRight: 0,
                        marginTop: 16,
                        fontFamily: 'ClashDisplay !important',
                    },
                },
            },
            MuiGrid: {
                styleOverrides: {
                    item: { lineHeight: 0 },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    notchedOutline: {
                        border: `1px solid ${colors.themeColor50}`,
                    },
                    input: {
                        fontFamily: 'ClashDisplay !important',
                        borderRadius: 6,
                        padding: "11.5px 20px",
                        color: colors.themeColor99,
                        "&::placeholder": {
                            fontSize: 16,
                            color: colors.secondaryText,
                            opacity: 1,
                        },
                    },
                },
            },
            MuiFilledInput: {
                styleOverrides: {
                    root: {
                        backgroundColor: colors.themeColor70,
                        "&:hover": {
                            backgroundColor: colors.themeColor60,
                        },
                        "&.Mui-focused": {
                            backgroundColor: colors.themeColor60,
                        },
                    },
                    input: {
                        fontFamily: 'ClashDisplay !important',
                        padding: "12px 16px",
                        color: colors.themeColor99,
                        "&::placeholder": {
                            fontSize: 14,
                            color: colors.secondaryText,
                            opacity: 0.8,
                        },
                    },
                },
            },
            MuiTypography: {
                styleOverrides: {
                    root: {
                        fontFamily: 'ClashDisplay !important',
                    }
                }
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        "& .MuiOutlinedInput-root": {
                            backgroundColor: `${colors.themeColor70} !important`,
                            "&:hover": {
                                backgroundColor: `${colors.themeColor60} !important`,
                            },
                            "&.Mui-focused": {
                                backgroundColor: `${colors.themeColor60} !important`,
                            },
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    outlinedSecondary: {
                        border: `2px solid ${colors.themeColor50}`,
                        color: colors.themeColor99,
                        "&:hover": {
                            border: `2px solid ${colors.themeColor40}`,
                            backgroundColor: colors.hoverColor,
                        },
                    },
                    root: {
                        fontFamily: 'ClashDisplay !important',
                        color: colors.themeColor99,
                        borderRadius: 6,
                        fontSize: 16,
                        fontWeight: 500,
                        lineHeight: "24px",
                        borderWidth: 2,
                        padding: "10px 16px",
                        textTransform: "initial",
                        minWidth: 60,
                    },
                    containedError: {
                        backgroundColor: colors.error,
                        borderColor: colors.error,
                        "&:hover": {
                            backgroundColor: "#E53935",
                        },
                        "&.Mui-disabled": {
                            opacity: 0.5,
                            cursor: "not-allowed",
                            color: colors.themeColor99,
                            boxShadow: "none",
                            borderColor: colors.error,
                            backgroundColor: colors.error,
                            pointerEvents: "unset",
                        },
                    },
                    outlinedPrimary: {
                        backgroundColor: "transparent",
                        borderColor: colors.primaryColor,
                        color: colors.primaryColor,
                        "&:hover": {
                            border: `2px solid ${colors.primaryColor}`,
                            backgroundColor: colors.hoverColor,
                            color: colors.themeColor99,
                        },
                        "&.Mui-disabled": {
                            opacity: 0.5,
                            cursor: "not-allowed",
                            color: colors.primaryColor,
                            boxShadow: "none",
                            borderColor: colors.primaryColor,
                            pointerEvents: "unset",
                        },
                    },
                    contained: {
                        boxShadow: "none",
                        borderWidth: 2,
                        borderColor: "inherit",
                        borderStyle: "solid",
                        "&:hover": {
                            boxShadow: "none",
                        },
                    },
                    containedPrimary: {
                        backgroundColor: colors.primaryColor,
                        boxShadow: "none",
                        borderColor: colors.primaryColor,
                        "&:hover": {
                            backgroundColor: colors.hoverColor,
                        },
                        "&.Mui-disabled": {
                            opacity: 0.5,
                            cursor: "not-allowed",
                            color: colors.themeColor99,
                            boxShadow: "none",
                            borderColor: colors.primaryColor,
                            backgroundColor: colors.primaryColor,
                            pointerEvents: "unset",
                        },
                    },
                    containedSecondary: {
                        backgroundColor: colors.secondaryColor,
                        boxShadow: "none",
                        borderColor: colors.secondaryColor,
                        "&:hover": {
                            backgroundColor: colors.hoverColor,
                        },
                        "&.Mui-disabled": {
                            opacity: 0.5,
                            cursor: "not-allowed",
                            color: colors.themeColor99,
                            boxShadow: "none",
                            borderColor: colors.secondaryColor,
                            backgroundColor: colors.secondaryColor,
                            pointerEvents: "unset",
                        },
                    },
                },
            },
            MuiCssBaseline: {
                styleOverrides: `
        @font-face {
          font-family: 'ClashDisplay';
          font-style: normal;
          font-weight: 400;
          src: url(${ClashDisplayRegular}) format('truetype');
        }
        @font-face {
          font-family: 'ClashDisplay';
          font-style: normal;
          font-weight: 500;
          src: url(${ClashDisplayMedium}) format('truetype');
        }
        @font-face {
          font-family: 'ClashDisplay';
          font-style: normal;
          font-weight: 600;
          src: url(${ClashDisplaySemiBold}) format('truetype');
        }
        @font-face {
          font-family: 'ClashDisplay';
          font-style: normal;
          font-weight: 700;
          src: url(${ClashDisplayBold}) format('truetype');
        }
        html, body {
          font-family: 'ClashDisplay', sans-serif !important;
          background-color: ${colors.themeColor80};
          color: ${colors.themeColor99};
        }
        *, *::before, *::after {
          font-family: 'ClashDisplay', sans-serif !important;
        }
      `,
            },
        },
        palette: {
            primary: {
                main: colors.primaryColor,
                dark: "#7A7A7A",
                light: "#9A9A9A",
            },
            secondary: {
                main: colors.secondaryColor,
                dark: colors.themeColor70,
                light: colors.themeColor50,
            },
            error: {
                main: colors.error,
                dark: "#E53935",
                light: "#EF5350",
            },
            warning: {
                main: colors.warning,
                dark: "#F57C00",
                light: "#FFCC02",
            },
            success: {
                main: colors.success,
                dark: "#388E3C",
                light: "#A5D6A7",
            },
            info: {
                main: colors.info,
                dark: "#1976D2",
                light: "#90CAF9",
            },
            textColor: colors.textColor,
            chatText: colors.chatText,
            themeColor: {
                0: colors.themeColor0,
                10: colors.themeColor10,
                20: colors.themeColor20,
                30: colors.themeColor30,
                40: colors.themeColor40,
                50: colors.themeColor50,
                60: colors.themeColor60,
                70: colors.themeColor70,
                71: colors.themeColor71,
                72: colors.themeColor72,
                75: colors.themeColor75,
                80: colors.themeColor80,
                85: colors.themeColor85,
                90: colors.themeColor90,
                99: colors.themeColor99,
            },
            gray: {
                90: colors.themeColor50,
            },
            text: {
                primary: colors.themeColor99,
                secondary: colors.secondaryText,
                disabled: colors.themeColor30,
            },
            participantListIcon: {
                primary: colors.iconColor,
                default: colors.iconColor,
                secondary: colors.iconColor,
            },
            iconColor: {
                primary: colors.iconColor,
                default: colors.iconColor,
                secondary: colors.iconColor,
            },
            darkIconColor: {
                primary: colors.darkIconColor,
                default: colors.darkIconColor,
                secondary: colors.darkIconColor,
            },
            // Interactive states
            action: {
                hover: colors.hoverColor,
                selected: colors.activeColor,
                disabled: colors.themeColor30,
                disabledOpacity: 0.5,
            },
            background: {
                default: colors.themeColor80,
                paper: colors.themeColor72,
                level1: colors.themeColor75,
                level2: colors.themeColor70,
            },
        },
    });

    return themeConfig;
}