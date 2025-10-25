/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          10: '#FFFFFF', // Was FFF
          20: '#FAFAFA',
          30: '#EDEDED',
          40: '#E0E0E0',
          50: '#C2C2C2',
          60: '#9E9E9E',
          70: '#757575',
          80: '#616161',
          90: '#404040',
          100: '#1D1F20',
        },
        primary: {
          main: '#01959F',
          surface: '#F3FBFC',
          border: '#4DB5BC',
          hover: '#01777F',
          pressed: '#01595F',
          focus: '#01959F', // Use this with an opacity class, e.g., 'ring-primary-focus/20'
        },
        secondary: {
          main: '#FBC037',
          surface: '#FFFCF5',
          border: '#FEEABC',
          hover: '#F8A92F',
          pressed: '#FA9810',
          focus: '#FBC037', // Use this with an opacity class, e.g., 'ring-secondary-focus/20'
        },
        danger: {
          main: '#E01428',
          surface: '#FFF9FA',
          border: '#F5B1B7',
          hover: '#BC1121',
          pressed: '#700A14',
          focus: '#E01428', // Use this with an opacity class, e.g., 'ring-danger-focus/20'
        },
        warning: {
          main: '#CA7336',
          surface: '#FCF7F3',
          border: '#FEB17B',
          hover: '#B1652F',
          pressed: '#985628',
          focus: '#CA7336', // Use this with an opacity class, e.g., 'ring-warning-focus/20'
        },
        success: {
          main: '#43936C',
          surface: '#F7F7F7',
          border: '#B8DBCA',
          hover: '#367A59',
          pressed: '#20573D',
          focus: '#731912', // Use this with an opacity class, e.g., 'ring-success-focus/20'
        },
      },
      fontFamily: {
        sans: ['Nunito Sans', 'sans-serif'],
      },
      fontSize: {
        // Text sizes
        xs: ['10px', '16px'],
        s: ['12px', '20px'],
        m: ['14px', '24px'],
        l: ['16px', '28px'],
        // Heading sizes
        'heading-s': ['20px', '32px'],
        'heading-m': ['24px', '36px'],
        'heading-l': ['32px', '44px'],
        // Display size
        display: ['48px', '64px'],
      },
    },
  },
  plugins: [],
};

