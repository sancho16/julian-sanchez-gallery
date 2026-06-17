// Central typography — import this anywhere you need the Dronien font
export const FONT_FAMILY = 'Dronien';

export const typography = {
  // Headings
  h1:    { fontFamily: FONT_FAMILY, fontSize: 32, letterSpacing: 2 },
  h2:    { fontFamily: FONT_FAMILY, fontSize: 22, letterSpacing: 1 },
  h3:    { fontFamily: FONT_FAMILY, fontSize: 17, letterSpacing: 0.5 },
  // Body
  body:  { fontFamily: FONT_FAMILY, fontSize: 14 },
  small: { fontFamily: FONT_FAMILY, fontSize: 11 },
  // Labels
  label: { fontFamily: FONT_FAMILY, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  // Nav / brand
  brand: { fontFamily: FONT_FAMILY, fontSize: 28, letterSpacing: 4, textTransform: 'uppercase' },
  // Button
  btn:   { fontFamily: FONT_FAMILY, fontSize: 13, letterSpacing: 0.5 },
};
