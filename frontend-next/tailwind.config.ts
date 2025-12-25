import type { Config } from 'tailwindcss'

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/ui/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/ui/*.{js,ts,jsx,tsx,mdx}',
		'./src/components-parser/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components-markdown/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Nunito', 'sans-serif'],
				display: ['Fredoka', 'sans-serif'],
				body: ['Nunito', 'sans-serif'],
			},
			boxShadow: {
				'hard': '4px 4px 0px 0px #1e293b',
				'hard-sm': '2px 2px 0px 0px #1e293b',
			},
			minWidth: {
				'250': '250px',
				'300': '300px',
				'1000': '1000px'
			},
			colors: {
				// PRIMARY COLORS
				primary: {
					DEFAULT: '#F6B1C3', // P-01 Sakura Pink
					foreground: '#4A4A4A', // N-04 Ink Gray
					strong: '#E67A8A',    // P-02 Deep Sakura
					leaf: '#8FC8A9',      // P-03 Leaf Green
					sky: '#8ECDE6',       // P-04 Sky Blue
				},
				// SECONDARY COLORS
				secondary: {
					DEFAULT: '#FFF1E6', // S-01 Warm Cream
					yellow: '#F6E7A3',  // S-02 Soft Yellow
					lavender: '#C8B6E2',// S-03 Lavender Mist
					coral: '#F2A1A1',   // S-04 Light Coral
				},
				// NEUTRAL COLORS
				neutral: {
					white: '#FAFAF7',   // N-01 Rice White
					beige: '#EFE6D8',   // N-02 Paper Beige
					gray: '#4A4A4A',    // N-04 Ink Gray (Black equivalent)
					ink: '#4A4A4A',     // N-04 Ink Gray
					night: '#2E2E2E',   // N-05 Night Ink
				},
				// ACCENT COLORS
				accent: {
					DEFAULT: '#F2B705', // A-02 Golden Sun
					red: '#D94A38',     // A-01 Torii Red
					jade: '#2FAE9E',    // A-03 Jade Green
					shadow: '#B85C7A',  // A-04 Sakura Shadow
				},
				// SHADCN COMPATIBILITY WRAPPERS
				background: '#FFF1E6', // S-01
				foreground: '#4A4A4A', // N-04
				card: {
					DEFAULT: '#FAFAF7', // N-01
					foreground: '#4A4A4A'
				},
				muted: {
					DEFAULT: '#EFE6D8', // N-02
					foreground: '#B8B8B8' // N-03
				},
				border: '#B8B8B8', // N-03
			},
			gridTemplateColumns: {
				listItem: '35px 1fr',
				body: '200px 1fr',
				itemsSentences: '399px 1fr',
				blogSideLeft: '48px 1fr 40px',
				blogSideRight: '48px 1fr 120px',
				blogs: '1fr 200px',
				closeBlogs: '1fr 80px'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'clay': '24px',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
		require("tailwindcss-animate")
	],
	darkMode: ['class'], // or 'media' for system preference
}
export default config







// --------------------------------------------------------

