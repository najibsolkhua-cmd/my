// Печатает справочник в PDF на одном листе (ширина A4, высота по содержимому).
// Нужен Playwright: npx playwright install chromium
const { chromium } = require('playwright')
const path = require('path')
;(async () => {
  const [html, pdf] = process.argv.slice(2)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } })
  await page.goto('file://' + path.resolve(html))
  const height = await page.evaluate(() => document.querySelector('main').scrollHeight)
  await page.pdf({ path: pdf, width: '794px', height: `${height + 2}px`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, pageRanges: '1' })
  await page.setViewportSize({ width: 794, height })
  await page.screenshot({ path: pdf.replace(/\.pdf$/, '.png'), fullPage: true })
  await browser.close()
  console.log('PDF:', pdf, `(${height}px)`)
})()
