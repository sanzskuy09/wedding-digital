import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import worker from '../dist/server/index.js'
assert.equal(typeof worker.fetch, 'function')
const files = []
function collect(dir, prefix = '') { for (const entry of readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name), url = prefix + '/' + entry.name; if (entry.isDirectory()) collect(file, url); else files.push([file, url]) } }
collect('dist/client')
for (const [file, url] of files) {
  const response = await worker.fetch(new Request('https://wedding.example' + url), {})
  assert.equal(response.status, 200, url)
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), readFileSync(file), url)
}
assert.match(await (await worker.fetch(new Request('https://wedding.example/'), {})).text(), /Ihsan &amp; Syifa|Ihsan & Syifa/)
assert.equal((await worker.fetch(new Request('https://wedding.example/missing.png'), {})).status, 404)
console.log(`Verified Worker entrypoint and all ${files.length} production assets.`)
