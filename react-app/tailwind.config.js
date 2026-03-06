/** @type {import('tailwindcss').Config} */
export default {
    theme: {
        extend: {
            fontFamily: {
                sans: ["Outfit", "sans-serif"],
            },
        },
    },
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
}
