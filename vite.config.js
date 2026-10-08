import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { validateRsvp, insertSql, rsvpValues } from './server/validation.js'
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
export default defineConfig({
  plugins: [vue(), {
    name: 'local-rsvp',
    async configureServer(server) {
      const { DatabaseSync } = await import('node:sqlite')
      mkdirSync('.local', { recursive: true })
      const db = new DatabaseSync('.local/rsvp.sqlite')
      db.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)')
      for (const name of readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) {
        if (!db.prepare('SELECT name FROM _migrations WHERE name = ?').get(name)) { db.exec(readFileSync(`drizzle/${name}`, 'utf8')); db.prepare('INSERT INTO _migrations VALUES (?)').run(name) }
      }
      server.httpServer?.once('close', () => db.close())
      server.middlewares.use('/api/rsvp', async (req, res) => {
        res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store')
        if (req.method !== 'POST') { res.statusCode = 405; res.end('{"error":"Method not allowed"}'); return }
        if (req.headers.origin !== `http://${req.headers.host}`) { res.statusCode = 403; res.end('{"error":"Origin not allowed"}'); return }
        try { let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 8192) throw new Error('Request too large') }; const data = validateRsvp(JSON.parse(raw)); db.prepare(insertSql).run(...rsvpValues(data)); res.statusCode = 201; res.end(JSON.stringify({ saved: true, id: data.id })) }
        catch { res.statusCode = 400; res.end('{"error":"Invalid RSVP"}') }
      })
    }
  }],
  build: { outDir: 'dist/client' }
})
