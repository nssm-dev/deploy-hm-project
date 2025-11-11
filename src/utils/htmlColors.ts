// HTML Color Constants - Exact values from assets/scss/_variables.scss

export interface ColorsType {
  // Theme Colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  success: string;
  successDark: string;
  warning: string;
  warningDark: string;
  danger: string;
  dangerDark: string;
  info: string;
  infoDark: string;
  dark: string;
  light: string;
  // Base Colors
  blue: string;
  indigo: string;
  purple: string;
  pink: string;
  red: string;
  orange: string;
  yellow: string;
  green: string;
  teal: string;
  cyan: string;
  violet: string;
  black: string;
  white: string;
  // Gray Scale
  gray: string;
  grayLight: string;
  grayLighter: string;
  grayLightest: string;
  grayDark: string;
  // Navbar Colors
  navbarBg: string;
  navbarBrandBg: string;
  navbarMenuColor: string;
  navbarToggler: string;
  navbarSearchBg: string;
  navbarSearchIcon: string;
  // Sidebar Colors
  sidebarBg: string;
  sidebarMenuColor: string;
  sidebarActiveColor: string;
  sidebarActiveBg: string;
  sidebarHoverBg: string;
  sidebarHoverColor: string;
  sidebarIconColor: string;
  sidebarIconBg: string;
  sidebarIconActive: string;
  // Background Colors
  contentBg: string;
  cardBg: string;
  whiteSmoke: string;
  borderColor: string;
  // Text Colors
  bodyColor: string;
  textMuted: string;
  cardTitle: string;
  cardDescription: string;
  pageTitle: string;
}

export interface SizesType {
  navbarHeight: string;
  sidebarWidth: string;
  sidebarWidthMini: string;
  sidebarWidthIcon: string;
  defaultFontSize: string;
  navbarFontSize: string;
  sidebarMenuFontSize: string;
  sidebarSubmenuFontSize: string;
  sidebarIconFontSize: string;
  inputFontSize: string;
  cardPaddingY: string;
  cardPaddingX: string;
  sidebarMenuPaddingY: string;
  sidebarMenuPaddingX: string;
  sidebarSubmenuPadding: string;
  inputPaddingY: string;
  inputPaddingX: string;
  cardBorderRadius: string;
  inputBorderRadius: string;
  btnBorderRadius: string;
}

import type { ButtonVariant, ButtonSize, GradientType } from "../types";

export const COLORS: ColorsType = {
  // Theme Colors
  primary: "#0062ff",
  primaryLight: "#3d8bff",
  primaryDark: "#0050d4",

  secondary: "#8e94a9",
  secondaryLight: "#a5aaba",
  secondaryDark: "#777d98",

  success: "#44ce42",
  successDark: "#38b336",

  warning: "#ffc542",
  warningDark: "#ffb830",

  danger: "#fc5a5a",
  dangerDark: "#fb4848",

  info: "#a461d8",
  infoDark: "#8e4dba",

  dark: "#001737",
  light: "#aab2bd",

  // Base Colors
  blue: "#5E50F9",
  indigo: "#6610f2",
  purple: "#6a008a",
  pink: "#E91E63",
  red: "#f96868",
  orange: "#f2a654",
  yellow: "#f6e84e",
  green: "#46c35f",
  teal: "#58d8a3",
  cyan: "#57c7d4",
  violet: "#41478a",
  black: "#000",
  white: "#ffffff",

  // Gray Scale
  gray: "#434a54",
  grayLight: "#aab2bd",
  grayLighter: "#e8eff4",
  grayLightest: "#e6e9ed",
  grayDark: "#0f1531",

  // Navbar Colors
  navbarBg: "#ffffff",
  navbarBrandBg: "#181824",
  navbarMenuColor: "#111111",
  navbarToggler: "#8e94a9",
  navbarSearchBg: "#eef0fa",
  navbarSearchIcon: "#8e94a9",

  // Sidebar Colors
  sidebarBg: "#181824",
  sidebarMenuColor: "#8e94a9",
  sidebarActiveColor: "#44ce42",
  sidebarActiveBg: "transparent",
  sidebarHoverBg: "#151520",
  sidebarHoverColor: "#ffffff",
  sidebarIconColor: "#8e94a9",
  sidebarIconBg: "rgba(194,244,219,.12)",
  sidebarIconActive: "#33c92d",

  // Background Colors
  contentBg: "#f0f1f6",
  cardBg: "#ffffff",
  whiteSmoke: "#f2f7f8",
  borderColor: "rgba(151,151,151, 0.3)",

  // Text Colors
  bodyColor: "#a7afb7",
  textMuted: "#a7afb7",
  cardTitle: "#001737",
  cardDescription: "#76838f",
  pageTitle: "#111",
};

export const SIZES: SizesType = {
  // Navbar
  navbarHeight: "64px",

  // Sidebar
  sidebarWidth: "258px",
  sidebarWidthMini: "185px",
  sidebarWidthIcon: "70px",

  // Font Sizes
  defaultFontSize: "0.875rem", // 14px
  navbarFontSize: "0.875rem",
  sidebarMenuFontSize: "0.937rem",
  sidebarSubmenuFontSize: "0.8125rem",
  sidebarIconFontSize: "1.125rem",
  inputFontSize: "0.8125rem",

  // Padding
  cardPaddingY: "2.5rem",
  cardPaddingX: "2.5rem",
  sidebarMenuPaddingY: "0.625rem",
  sidebarMenuPaddingX: "2.375rem",
  sidebarSubmenuPadding: "0.75rem 2rem",
  inputPaddingY: "0.94rem",
  inputPaddingX: "1.375rem",

  // Border Radius
  cardBorderRadius: "0.3125rem",
  inputBorderRadius: "2px",
  btnBorderRadius: "0.1875rem",
};

// Button Styles (HTML Exact Match)
export const getButtonStyle = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "default"
): React.CSSProperties => {
  const baseStyle = {
    fontFamily: "Ubuntu, sans-serif",
    fontSize: SIZES.defaultFontSize,
    fontWeight: "600",
    borderRadius: SIZES.btnBorderRadius,
    transition: "all 0.25s ease",
    border: "none",
    cursor: "pointer",
    lineHeight: "1",
  };

  const sizeStyles = {
    sm: {
      padding: "0.50rem 0.81rem",
    },
    default: {
      padding: "0.775rem 0.75rem",
    },
    lg: {
      padding: "1rem 3rem",
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.white,
    },
    secondary: {
      backgroundColor: COLORS.secondary,
      color: COLORS.white,
    },
    success: {
      backgroundColor: COLORS.success,
      color: COLORS.white,
    },
    warning: {
      backgroundColor: COLORS.warning,
      color: COLORS.white,
    },
    danger: {
      backgroundColor: COLORS.danger,
      color: COLORS.white,
    },
    info: {
      backgroundColor: COLORS.info,
      color: COLORS.white,
    },
  };

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

// Card Styles (HTML Exact Match)
export const getCardStyle = (): React.CSSProperties => ({
  backgroundColor: COLORS.cardBg,
  borderRadius: SIZES.cardBorderRadius,
  padding: `${SIZES.cardPaddingY} ${SIZES.cardPaddingX}`,
  boxShadow: "0px 1px 15px 1px rgba(230, 234, 236, 0.35)",
});

// Input Styles (HTML Exact Match)
export const getInputStyle = (): React.CSSProperties => ({
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.borderColor}`,
  borderRadius: SIZES.inputBorderRadius,
  padding: `${SIZES.inputPaddingY} ${SIZES.inputPaddingX}`,
  fontSize: SIZES.inputFontSize,
  color: COLORS.dark,
  outline: "none",
  transition: "all 0.25s ease",
});

// Navbar Link Style (HTML Exact Match)
export const getNavLinkStyle = (
  isActive: boolean = false
): React.CSSProperties => ({
  color: isActive ? COLORS.primary : COLORS.navbarMenuColor,
  fontSize: SIZES.navbarFontSize,
  fontFamily: "Ubuntu, sans-serif",
  textDecoration: "none",
  transition: "color 0.25s ease",
});

// Sidebar Menu Item Style (HTML Exact Match)
export const getSidebarMenuStyle = (
  isActive: boolean = false,
  isHovered: boolean = false
): React.CSSProperties => {
  let style = {
    display: "flex",
    alignItems: "center",
    padding: `${SIZES.sidebarMenuPaddingY} ${SIZES.sidebarMenuPaddingX}`,
    fontSize: SIZES.sidebarMenuFontSize,
    color: isActive ? COLORS.sidebarActiveColor : COLORS.sidebarMenuColor,
    backgroundColor: isActive ? COLORS.sidebarActiveBg : "transparent",
    borderRadius: "8px",
    textDecoration: "none",
    transition: "all 0.25s ease",
    cursor: "pointer",
  };

  if (isHovered && !isActive) {
    style.backgroundColor = COLORS.sidebarHoverBg;
    style.color = COLORS.sidebarHoverColor;
  }

  return style;
};

// Sidebar Submenu Item Style
export const getSidebarSubmenuStyle = (
  isActive: boolean = false
): React.CSSProperties => ({
  padding: SIZES.sidebarSubmenuPadding,
  fontSize: SIZES.sidebarSubmenuFontSize,
  color: isActive ? COLORS.sidebarActiveColor : COLORS.sidebarMenuColor,
  textDecoration: "none",
  transition: "color 0.25s ease",
});

// Utility function to get gradient background
export const getGradientBg = (type: GradientType): string => {
  const gradients = {
    primary: "linear-gradient(to right, #da8cff, #9a55ff)",
    secondary: "linear-gradient(to right, #e7ebf0, #868e96)",
    success: "linear-gradient(to right, #84d9d2, #07cdae)",
    info: "linear-gradient(to right, #90caf9, #047edf 99%)",
    warning: "linear-gradient(to right, #f6e384, #ffd500)",
    danger: "linear-gradient(to right, #ffbf96, #fe7096)",
    light: "linear-gradient(to bottom, #f4f4f4, #e4e4e9)",
    dark: "linear-gradient(89deg, #5e7188, #3e4b5b)",
  };

  return gradients[type] || gradients.primary;
};

export default COLORS;
