// "Ink & Index": black-and-white UI, the only color is each course's accent.
// Light values come from DESIGN.md; the dark palette mirrors them.

export interface Palette {
  bg: string;
  surface: string;
  line: string;
  rowLine: string;
  ink: string;
  ink2: string;
  ink3: string;
  /** Text and icons placed on an `ink` fill. */
  onInk: string;
  danger: string;
  /** Fill of course tiles that cannot be opened offline. */
  muted: string;
}

export const light: Palette = {
  bg: '#F2F3F5',
  surface: '#FFFFFF',
  line: '#DDE1E7',
  rowLine: '#E7EAEF',
  ink: '#11151C',
  ink2: '#475162',
  ink3: '#5F6878',
  onInk: '#FFFFFF',
  danger: '#B42318',
  muted: '#E7EAEF',
};

export const dark: Palette = {
  bg: '#0E1116',
  surface: '#171B22',
  line: '#2A303B',
  rowLine: '#222832',
  ink: '#F2F3F5',
  ink2: '#B9C0CC',
  ink3: '#98A1B0',
  onInk: '#11151C',
  danger: '#F97066',
  muted: '#222832',
};

/** The PDF viewer keeps its dark surround in both themes. */
export const reader = {
  bg: '#1B1F27',
  chrome: '#2A303B',
  footer: '#141820',
  text: '#FFFFFF',
  text2: '#B9C0CC',
};

export const radii = { hero: 24, card: 16, tile: 12, chip: 8, pill: 999 };
export const space = { screen: 20, gap: 14, section: 22 };
export const TOUCH = 44;

export const fonts = {
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  semibold: 'SchibstedGrotesk_600SemiBold',
  bold: 'SchibstedGrotesk_700Bold',
  extrabold: 'SchibstedGrotesk_800ExtraBold',
  mono: 'IBMPlexMono_500Medium',
};

export const type = {
  screenTitle: { fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 40, letterSpacing: -0.6 },
  hero: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 36, letterSpacing: -0.5 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 15.5, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 },
  mono: { fontFamily: fonts.mono, fontSize: 11.5, lineHeight: 16, letterSpacing: 0.7, textTransform: 'uppercase' },
} as const;

export type TypeVariant = keyof typeof type;

/** Accent at ~10% on the surface, for chips. */
export function tint(accent: string, surface: string): string {
  const mix = (a: number, b: number) => Math.round(a * 0.1 + b * 0.9);
  const ch = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) => mix(ch(accent, i), ch(surface, i)).toString(16).padStart(2, '0'))
    .join('')}`;
}
