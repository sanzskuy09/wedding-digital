import { build } from 'esbuild'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const assets = {}
function collect(dir, prefix = '') {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filename = path.join(dir, entry.name), url = prefix + '/' + entry.name
    if (entry.isDirectory()) collect(filename, url)
    else assets[url] = { body: readFileSync(filename).toString('base64'), type: contentTypes[path.extname(filename)] || 'application/octet-stream' }
  }
}
collect('dist/client')
await build({ entryPoints: ['server/index.js'], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', outfile: 'dist/server/index.js', minify: true, plugins: [{ name: 'standalone-assets', setup(build) { build.onLoad({ filter: /server\/assets\.js$/ }, () => ({ contents: 'export default ' + JSON.stringify(assets), loader: 'js' })) } }] })
console.log(`Worker built with ${Object.keys(assets).length} assets and durable RSVP API.`)
