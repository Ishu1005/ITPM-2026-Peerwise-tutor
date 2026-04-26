// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        cinnamon: {
          DEFAULT: '#7B3F00',
          light: '#D6A77A',
          bg: '#FFF8F0',
          hover: '#5c2c00',
          glass:   "rgba(255,250,242,0.8)",
        },
        peerwise: {
          cyan: '#4AB9E6',
          'cyan-dark': '#2a9fd4',
          'cyan-light': '#E8F6FC',
          navy: '#002D5B',
          midnight: '#001A33',
        },
        wyzant: {
          teal: '#4AB9E6',
          'teal-dark': '#236b94',
          'teal-light': '#E8F6FC',
          ink: '#002D5B',
          muted: '#5c6770',
          border: '#e2e8f0',
          link: '#4AB9E6',
          page: '#f4f8fb',
          orange: '#4AB9E6',
        },
        market: {
          nav: '#001A33',
          cream: '#f4f8fb',
          orange: '#4AB9E6',
          'orange-hover': '#2a9fd4',
          lime: '#7dd3fc',
          forest: '#002D5B',
          ink: '#002D5B',
        },
      },
      animation: {
        'spin-slow': 'spin 6s linear infinite',
        'spin-fast': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};
