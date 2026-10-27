export type ColorThemeId = 'sage' | 'sand' | 'rose';

export interface ColorThemeOption {
  id: ColorThemeId;
  name: string;
  tagline: string;
  primary: string;
  hover: string;
  light: string;
  bg: string;
  swatchHex: string;
}

export const APP_COLOR_THEMES: Record<ColorThemeId, ColorThemeOption> = {
  sage: {
    id: 'sage',
    name: 'Sage Green',
    tagline: 'Segar, tenang, dan bersahaja',
    primary: '#556B2F',
    hover: '#465926',
    light: '#708846',
    bg: '#F5F2EB',
    swatchHex: '#556B2F',
  },
  sand: {
    id: 'sand',
    name: 'Warm Sand',
    tagline: 'Hangat, klasik, dan membumi',
    primary: '#9E7151',
    hover: '#835B3E',
    light: '#B58463',
    bg: '#F8F5F0',
    swatchHex: '#9E7151',
  },
  rose: {
    id: 'rose',
    name: 'Soft Rose',
    tagline: 'Lembut, hangat, dan penuh kasih',
    primary: '#9E5D67',
    hover: '#854852',
    light: '#BA7682',
    bg: '#F9F3F4',
    swatchHex: '#9E5D67',
  },
};

/**
 * Strictly manipulates ONLY root CSS color variables.
 * Never alters font sizes, margins, padding, or layouts.
 */
export function applyAppColorTheme(themeId: ColorThemeId): void {
  const theme = APP_COLOR_THEMES[themeId] || APP_COLOR_THEMES.sage;
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.primary);
  root.style.setProperty('--primary-hover', theme.hover);
  root.style.setProperty('--primary-light', theme.light);
  root.style.setProperty('--bg-color', theme.bg);
  root.style.setProperty('--color-sage', theme.primary);
  root.style.setProperty('--color-sageLight', theme.light);
  root.style.setProperty('--color-sageHover', theme.hover);
  root.style.setProperty('--color-appBg', theme.bg);

  try {
    localStorage.setItem('bunda_app_color_theme', themeId);
  } catch {}
}

export function getSavedAppColorTheme(): ColorThemeId {
  if (typeof localStorage === 'undefined') return 'sage';
  const saved = localStorage.getItem('bunda_app_color_theme') as ColorThemeId;
  return saved && APP_COLOR_THEMES[saved] ? saved : 'sage';
}
