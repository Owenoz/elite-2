/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#09090F",
        secondary: "#12121A",
        light: {
          100: "#F5F0FF",
          200: "#A8B5DB",
          300: "#6B7280",
        },
        dark: {
          100: "#1C1B2E",
          200: "#12121A",
          300: "#0D0D17",
        },
        accent: "#AB8BFF",
        gold: "#D4AF37",
        "gold-light": "#F0D060",
        "gold-dark": "#A0831A",
        elite: "#D4AF37",
      },
    },
  },
  plugins: [],
};
