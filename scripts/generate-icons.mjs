// public/favicon.svg から PWA 用の PNG アイコンを生成する
// 使い方: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const src = new URL('../public/favicon.svg', import.meta.url).pathname
const outDir = new URL('../public/icons/', import.meta.url).pathname
await mkdir(outDir, { recursive: true })

await sharp(src).resize(192, 192).png().toFile(`${outDir}icon-192.png`)
await sharp(src).resize(512, 512).png().toFile(`${outDir}icon-512.png`)

// maskable はセーフゾーン確保のため 80% に縮小して余白をつける
const inner = await sharp(src).resize(410, 410).png().toBuffer()
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: '#2563eb',
  },
})
  .composite([{ input: inner, gravity: 'centre' }])
  .png()
  .toFile(`${outDir}icon-512-maskable.png`)

console.log('icons generated in public/icons/')
