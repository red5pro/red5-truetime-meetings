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

export function getBlueTheme(): Theme {
    // Blue Theme Color Palette
    const colors: ThemeColors = {
        themeColor0: "#E0F2FE",    // Lightest blue - High contrast text/elements
        themeColor10: "#BAE6FD",   // Very light blue
        themeColor20: "#7DD3FC",   // Light blue
        themeColor30: "#38BDF8",   // Medium light blue
        themeColor40: "#3B82F6",   // Active secondary
        themeColor50: "#2563EB",   // Blue borders/accents
        themeColor60: "#1E3A8A",   // Card backgrounds (Dark Blue)
        themeColor70: "#172554",   // Dark backgrounds (Darker Blue)
        themeColor71: "#0F172A",   // Slightly darker (Slate 900)
        themeColor72: "#1E293B",   // Sidebar (Slate 800)
        themeColor75: "#020617",   // Very dark (Slate 950)
        themeColor80: "#02040A",   // Almost black blue - Main BG
        themeColor85: "#000000",   // Footer/Header
        themeColor90: "#000000",   // Deepest
        themeColor99: "#FFFFFF",   // Pure white

        // Text & Icon Colors
        textColor: "#F8FAFC",      // Slate 50
        chatText: "#F8FAFC",
        secondaryText: "#94A3B8",  // Slate 400
        iconColor: "#FFFFFF",
        darkIconColor: "#3B82F6",

        // Functional Colors
        error: "#EF4444",
        warning: "#F59E0B",
        success: "#10B981",
        info: "#3B82F6",

        // Primary & Secondary Colors
        primaryColor: "#3B82F6",
        secondaryColor: "#1E293B",

        // Interactive States
        hoverColor: "#1D4ED8",
        activeColor: "#1E40AF",
        focusColor: "#3B82F6",
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
