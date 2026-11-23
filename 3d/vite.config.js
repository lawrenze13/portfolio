import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, pathToFileURL } from 'node:url'

// The plain view (/plain/), llms.txt, resume.json, the sitemap and the 404 page are rendered from the same
// data as the 3D: served live in dev, written into dist at build time. The 3D
// page gets the same head tags (description, link preview, structured data).
function plainView() {
  const RENDER = '/src/plain/render.js'
  const FILES = {
    'plain/index.html': ['text/html; charset=utf-8', (m) => m.renderPlain()],
    'llms.txt': ['text/plain; charset=utf-8', (m) => m.renderLlms()],
    'resume.json': ['application/json; charset=utf-8', (m) => m.renderResume()],
    '404.html': ['text/html; charset=utf-8', (m) => m.render404()],
    'sitemap.xml': ['application/xml; charset=utf-8', (m) => m.renderSitemap()],
  }
  let server
  const load = () => server
    ? server.ssrLoadModule(RENDER)
    : import(pathToFileURL(fileURLToPath(new URL('.' + RENDER, import.meta.url))).href)

  return {
    name: 'plain-view',
    configureServer(s) {
      server = s
      s.middlewares.use(async (req, res, next) => {
        const path = req.url.split('?')[0]
        if (path === '/plain') {
          res.writeHead(301, { Location: '/plain/' })
          return res.end()
        }
        const file = FILES[path === '/plain/' ? 'plain/index.html' : path.slice(1)]
        if (!file) return next()
        try {
          res.setHeader('Content-Type', file[0])
          res.end(file[1](await load()))
        } catch (e) {
          next(e)
        }
      })
    },
    async transformIndexHtml(html) {
      return html.replace('<!-- head -->', (await load()).headTags({ path: '/', root: './' }))
    },
    async generateBundle() {
      const m = await load()
      for (const [fileName, [, render]] of Object.entries(FILES)) {
        this.emitFile({ type: 'asset', fileName, source: render(m) })
      }
    },
  }
}

// three.js and the libraries around it change least, so they get a chunk of
// their own that stays cached between releases; React gets another. Small
// shared helpers go with React: left alone, Rollup puts them in the three
// chunk and the page then waits for all of three.js before showing any text.
function chunks(id) {
  if (/preload-helper|commonjsHelpers|node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
  if (id.includes('node_modules')) return 'three'
}

export default defineConfig({
  plugins: [react(), plainView()],
  base: './',
  build: { chunkSizeWarningLimit: 1200, rollupOptions: { output: { manualChunks: chunks } } }, // three is ~1.1 MB before gzip
  server: { host: '127.0.0.1', port: 4318, strictPort: true },
})
