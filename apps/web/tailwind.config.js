/** Shekor Tailwind preset — ported 1:1 from the approved mockups (_src/tailwind.config.js). */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.25rem', lg: '2rem' }, screens: { '2xl': '1360px' } },
    extend: {
      colors: {
        bg: v('bg'), surface: v('surface'), 'surface-2': v('surface-2'), ink: v('ink'), muted: v('muted'), line: v('line'),
        primary: v('primary'), 'primary-hover': v('primary-hover'), 'on-primary': v('on-primary'), 'primary-soft': v('primary-soft'),
        accent: v('accent'), 'accent-soft': v('accent-soft'), teak: v('teak'), sale: v('sale'), success: v('success'), warning: v('warning'), info: v('info'),
        forest: { 50:'#EEF5F1',100:'#D7E8DE',200:'#AFD1BE',300:'#7FB496',400:'#4F9170',500:'#2F6F52',600:'#1F4D3A',700:'#193F30',800:'#143226',900:'#0E241B' },
        walnut: { 50:'#F8F1EB',100:'#EEDCCB',200:'#DDB99A',300:'#C89B6D',400:'#A9734B',500:'#7C4A2D',600:'#653B24',700:'#4E2D1C' },
        linen: { 50:'#FBF9F5',100:'#F7F3EC',200:'#F4EFE6',300:'#EAE1D2',400:'#DCCFBA' },
        sand: { DEFAULT:'#C89B6D', 200:'#E9D7C2', 400:'#C89B6D', 600:'#9C7148' }, deep: { DEFAULT:'#14231C', 800:'#1A2E25', 950:'#0D1712' },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-hind)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'var(--font-hind)', 'Georgia', 'serif'],
        bn: ['var(--font-hind)', 'sans-serif'],
      },
      borderRadius: { md: '2px', lg: '2px', xl: '3px', '2xl': '4px', '3xl': '6px' },
      boxShadow: { card: '0 1px 0 rgb(20 35 28 / .04)', pop: '0 30px 80px -30px rgb(20 35 28 / .45)' },
      maxWidth: { '8xl': '88rem' },
      keyframes: { kenburns: { '0%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)' } }, 'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } } },
      animation: { kenburns: 'kenburns 14s ease-out both', 'fade-up': 'fade-up .35s ease-out both' },
    },
  },
  plugins: [],
};
