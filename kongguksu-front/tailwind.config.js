// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FDF9ED',
        primary: '#695E34',
        'primary-container': '#EFE3B2',
        'on-primary-container': '#2A2208',
        'on-surface': '#221F16',
        'on-surface-variant': '#4B463B',
        outline: '#7A7466',
        'outline-variant': '#BDB5A3',
        surface: '#FDF9ED',
        'surface-container': '#EEE8D8',
        'surface-container-low': '#F7F3E8',
        'surface-container-high': '#ECE8DC',
        'surface-container-highest': '#E6E2D7',
        'surface-container-lowest': '#FFFFFF',
        secondary: '#44682F',
        'secondary-container': '#DDE7C5',
        'on-secondary-container': '#1F2A12',
        tertiary: '#5F5E5E',
        'primary-fixed': '#F3E2AD',
        'on-primary-fixed-variant': '#51461F',
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        label: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
