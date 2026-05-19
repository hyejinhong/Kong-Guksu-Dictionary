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
        outline: '#7A7466',
        'outline-variant': '#BDB5A3',
        'surface-container': '#EEE8D8',
        'surface-container-lowest': '#FFFFFF',
        'secondary-container': '#DDE7C5',
        'on-secondary-container': '#1F2A12',
      },
    },
  },
  plugins: [],
}
