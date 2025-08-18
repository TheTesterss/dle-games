/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#3B82F6',
                secondary: '#60A5FA',
                accent: '#FACC15',
                darkBg: '#1A202C',
                darkText: '#E2E8F0',
                lightBg: '#FFFFFF',
                lightText: '#1A202C'
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif']
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '25%': { transform: 'translateY(-5px) rotate(5deg)' },
                    '50%': { transform: 'translateY(0) rotate(0deg)' },
                    '75%': { transform: 'translateY(5px) rotate(-5deg)' }
                },
                rotate: {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                }
            },
            animation: {
                'float-slow': 'float 4s ease-in-out infinite',
                'float-medium': 'float 3s ease-in-out infinite',
                'float-fast': 'float 2s ease-in-out infinite',
                'spin-slow': 'rotate 20s linear infinite',
                'spin-medium': 'rotate 15s linear infinite',
                'spin-fast': 'rotate 10s linear infinite'
            }
        }
    },
    plugins: []
};
