import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const background = '#1f5f8b'

// Generates PNG icons from public/icon.svg: `pnpm generate-pwa-assets`.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background } },
  },
  images: ['public/icon.svg'],
})
