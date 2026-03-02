import { ThemeConfig, theme } from "antd";

/**
 * AIO-MUSIC Dark Theme for Ant Design
 */
const antdThemeConfig: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    // Brand colors
    colorPrimary: "#FF6F00", // Orange
    colorLink: "#FFA000", // Amber
    colorSuccess: "#87d068",
    colorWarning: "#ffc53d",
    colorError: "#ff4d4f",

    // Layout
    colorBgBase: "#121212",
    colorBgContainer: "#1e1e1e", // zinc-900/800 eq
    colorBgElevated: "#2a2a2a",
    colorBgLayout: "#121212",

    // Text
    colorText: "#ffffff",
    colorTextSecondary: "#a1a1aa", // zinc-400
    colorTextTertiary: "#71717a", // zinc-500
    colorTextQuaternary: "#52525b", // zinc-600

    // Border
    colorBorder: "#3f3f46", // zinc-700
    colorBorderSecondary: "#27272a", // zinc-800

    // Radius
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    // Font
    fontFamily:
      "'Inter', 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeXL: 20,

    // Control height
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // Shadow
    boxShadow: "0 4px 24px 0 rgba(255, 111, 0, 0.15)",
    boxShadowSecondary: "0 2px 12px 0 rgba(0, 0, 0, 0.5)",
  },
  components: {
    Button: {
      colorPrimary: "#FF6F00",
      colorPrimaryHover: "#FFA000",
      borderRadius: 12,
      fontWeight: 600,
    },
    Card: {
      colorBgContainer: "#1e1e1e",
      borderRadius: 16,
    },
    Input: {
      colorBgContainer: "transparent",
      activeBg: "transparent",
      hoverBg: "transparent",
      borderRadius: 12,
    },
    Select: {
      colorBgContainer: "transparent",
      borderRadius: 12,
    },
    Slider: {
      colorPrimary: "#FF6F00",
      colorPrimaryBorder: "#FF6F00",
      trackBg: "rgba(255, 255, 255, 0.2)",
      railBg: "rgba(255, 255, 255, 0.2)",
    },
    Menu: {
      colorItemBg: "transparent",
      colorItemBgSelected: "rgba(255, 111, 0, 0.1)",
      colorItemTextSelected: "#FF6F00",
    },
    Layout: {
      colorBgHeader: "#121212",
      colorBgSolid: "#1e1e1e",
      colorBgBody: "#121212",
    },
    Modal: {
      colorBgElevated: "#18181b", // zinc-900
      headerBg: "transparent",
      titleColor: "#ffffff",
      contentBg: "#18181b", // Make modal dark zinc
      padding: 24,
      borderRadiusLG: 16,
    },
    Popconfirm: {
      colorBgElevated: "#27272a", // zinc-800
    },
  },
};

export default antdThemeConfig;
