import type { ThemeConfig } from 'antd';

/**
 * AIO-MUSIC Pastel Theme for Ant Design
 */
const antdThemeConfig: ThemeConfig = {
  token: {
    // Brand colors
    colorPrimary: '#ffa883',        // Cam San hô
    colorLink: '#6fc7e2',           // Xanh trời
    colorSuccess: '#87d068',
    colorWarning: '#ffc53d',
    colorError: '#ff4d4f',

    // Layout
    colorBgBase: '#faf2e8',         // Kem nhạt
    colorBgContainer: '#fde3c8',    // Đào nhạt
    colorBgElevated: '#fff8f2',
    colorBgLayout: '#faf2e8',

    // Text
    colorText: '#3d2b1f',
    colorTextSecondary: '#7a5c4e',
    colorTextTertiary: '#b89080',
    colorTextQuaternary: '#d4b4a4',

    // Border
    colorBorder: '#f0d4be',
    colorBorderSecondary: '#f8e8d8',

    // Radius
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    // Font
    fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeXL: 20,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    // Control height
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // Shadow
    boxShadow: '0 4px 24px 0 rgba(255, 168, 131, 0.15)',
    boxShadowSecondary: '0 2px 12px 0 rgba(61, 43, 31, 0.08)',
  },
  components: {
    Button: {
      colorPrimary: '#ffa883',
      colorPrimaryHover: '#e8845f',
      borderRadius: 12,
      fontWeight: 600,
    },
    Card: {
      colorBgContainer: '#fde3c8',
      borderRadius: 16,
    },
    Input: {
      colorBgContainer: '#fff8f2',
      borderRadius: 12,
    },
    Select: {
      colorBgContainer: '#fff8f2',
      borderRadius: 12,
    },
    Slider: {
      colorPrimary: '#ffa883',
      colorPrimaryBorder: '#ffa883',
      trackBg: '#f0d4be',
      railBg: '#f0d4be',
    },
    Menu: {
      colorItemBg: 'transparent',
      colorItemBgSelected: '#fde3c8',
      colorItemTextSelected: '#ffa883',
    },
    Layout: {
      colorBgHeader: '#faf2e8',
      colorBgSider: '#fde3c8',
      colorBgBody: '#faf2e8',
    },
  },
};

export default antdThemeConfig;
