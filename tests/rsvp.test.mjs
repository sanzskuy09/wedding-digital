import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import worker from '../server/index.js'
import { validateRsvp } from '../server/validation.js'
const body = () => ({ id: crypto.randomUUID(), name: 'Tamu Pengujian', attendance: 'yes', guests: 2, message: 'Semoga bahagia.', website: '' })
function request(payload, options = {}) { return new Request('https://wedding.example/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://wedding.example', ...options.headers }, body: JSON.stringify(payload) }) }
function database() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(readFileSync('drizzle/0000_certain_firebrand.sql', 'utf8'))
  return { sqlite, DB: { prepare(sql) { return { bind(...values) { return { async run() { return sqlite.prepare(sql).run(...values) } } } } } } }
}
test('RSVP tersimpan dengan jumlah tamu dan retry tidak menambahkan duplikat', async () => {
  const { sqlite, DB } = database(); const payload = body()
  assert.equal((await worker.fetch(request(payload), { DB })).status, 201)
  assert.equal((await worker.fetch(request(payload), { DB })).status, 201)
  assert.equal(sqlite.prepare('SELECT count(*) AS count FROM rsvps').get().count, 1)
  const row = sqlite.prepare('SELECT * FROM rsvps').get()
  assert.equal(row.name, payload.name); assert.equal(row.guests, 2); assert.equal(row.message, payload.message)
  sqlite.close()
})
test('tidak hadir menyimpan jumlah tamu nol', async () => {
  const { sqlite, DB } = database(); const payload = { ...body(), attendance: 'no' }
  assert.equal((await worker.fetch(request(payload), { DB })).status, 201)
  assert.equal(sqlite.prepare('SELECT guests FROM rsvps').get().guests, 0); sqlite.close()
})
test('validasi menolak nama kosong, jumlah tamu tidak valid, ucapan panjang, dan honeypot', () => {
  for (const invalid of [{ name: ' ' }, { guests: 4 }, { guests: 0 }, { guests: 1.5 }, { attendance: 'maybe' }, { message: 'x'.repeat(1001) }, { website: 'bot' }, { id: 'invalid' }]) assert.throws(() => validateRsvp({ ...body(), ...invalid }))
})
test('maksimal tiga tamu diterima dan empat tamu ditolak sebelum penyimpanan', async () => {
  const { sqlite, DB } = database()
  assert.equal((await worker.fetch(request({ ...body(), guests: 3 }), { DB })).status, 201)
  assert.equal((await worker.fetch(request({ ...body(), guests: 4 }), { DB })).status, 400)
  assert.equal(sqlite.prepare('SELECT guests FROM rsvps').get().guests, 3)
  assert.equal(sqlite.prepare('SELECT count(*) AS count FROM rsvps').get().count, 1)
  sqlite.close()
})
test('origin asing dan permintaan GET tidak dapat membaca/mengisi RSVP', async () => {
  assert.equal((await worker.fetch(request(body(), { headers: { Origin: 'https://another.example' } }), {})).status, 403)
  assert.equal((await worker.fetch(new Request('https://wedding.example/api/rsvp'), {})).status, 405)
})
test('kegagalan database tidak memberi konfirmasi sukses palsu', async () => {
  const response = await worker.fetch(request(body()), {})
  assert.equal(response.status, 503); assert.equal((await response.json()).error.includes('belum tersimpan'), true)
})
test('rute undangan diteruskan ke aset statis', async () => {
  const response = await worker.fetch(new Request('https://wedding.example/'), { ASSETS: { fetch: async () => new Response('<html>Undangan</html>') } })
  assert.equal(response.status, 200); assert.match(await response.text(), /Undangan/)
})
