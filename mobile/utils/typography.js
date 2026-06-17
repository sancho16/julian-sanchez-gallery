// Dronien font ONLY has 52 glyphs (A-Z, a-z, basic punctuation)
// Use it ONLY for the brand name "DRONIEN" — nothing else
export const FONT_FAMILY = 'Dronien';

// Only brand/logo text uses Dronien
export const typography = {
  brand: { fontFamily: 'Dronien', fontSize: 28, letterSpacing: 4, textTransform: 'uppercase' },
  // All other text uses system font (Dronien missing most glyphs)
  h1:    { fontSize: 32, fontWeight: '700' },
  h2:    { fontSize: 22, fontWeight: '600' },
  h3:    { fontSize: 17, fontWeight: '600' },
  body:  { fontSize: 14 },
  small: { fontSize: 11 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  btn:   { fontSize: 13, fontWeight: '500' },
};
