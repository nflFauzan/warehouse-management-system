/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs', './public/**/*.js'],
  theme: {
    extend: {
      colors: {
        'blue-primary': '#1F4E8C',
        'yellow-accent': '#F2C500',
        'dark-gray': '#2B2B2B',
        'light-gray': '#F5F5F5',
        'success': '#2D7A4F',
        'danger': '#B22222',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
