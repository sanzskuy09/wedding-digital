import test from 'node:test'
import assert from 'node:assert/strict'
import { createRsvpHandler } from '../server/vercel-rsvp.js'

const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test-publishable' }
const payload = () => ({ id: crypto.randomUUID(), name: 'Tamu Pengujian', attendance: 'yes', guests: 3, message: 'Semoga bahagia.', website: '' })
async function invoke(body, options = {}) {
  const result = { headers: {} }
  const res = { setHeader(key, value) { result.headers[key] = value }, status(value) { result.status = value; return this }, json(value) { result.body = value; return this } }
  const handler = createRsvpHandler({ env, fetchImpl: async () => new Response(null, { status: 201 }), ...options.dependencies })
  await handler({ method: 'POST', headers: { host: 'wedding.example', origin: 'https://wedding.example', 'content-type': 'application/json', ...options.headers }, body, ...options.request }, res)
  return result
}

test('Vercel menyimpan tiga tamu dengan payload bersih dan retry idempotent', async () => {
  const data = payload()
  const result = await invoke(data, { dependencies: { fetchImpl: async (url, options) => {
    assert.equal(url.pathname, '/rest/v1/rsvps')
    assert.equal(url.search, '')
    assert.equal(options.headers.Prefer, 'return=minimal')
    assert.equal(options.headers.apikey, env.SUPABASE_PUBLISHABLE_KEY)
    assert.deepEqual(JSON.parse(options.body), { id: data.id, name: data.name, attendance: 'yes', guests: 3, message: data.message })
    return new Response(null, { status: 201 })
  } } })
  assert.equal(result.status, 201)
  assert.deepEqual(result.body, { saved: true, id: data.id })
})
test('retry UUID yang tersimpan berhasil tanpa upsert atau izin baca', async () => {
  const result = await invoke(payload(), { dependencies: { fetchImpl: async () => Response.json({ code: '23505' }, { status: 409 }) } })
  assert.equal(result.status, 201)
  assert.equal(result.body.saved, true)
  assert.equal((await invoke(payload(), { dependencies: { fetchImpl: async () => Response.json({ code: '23514' }, { status: 409 }) } })).status, 503)
})
test('tidak hadir disimpan dengan jumlah tamu nol', async () => {
  await invoke({ ...payload(), attendance: 'no' }, { dependencies: { fetchImpl: async (_, options) => {
    assert.equal(JSON.parse(options.body).guests, 0)
    return new Response(null, { status: 201 })
  } } })
})
test('empat tamu dan honeypot ditolak sebelum akses database', async () => {
  for (const changes of [{ guests: 4 }, { website: 'bot' }]) {
    assert.equal((await invoke({ ...payload(), ...changes }, { dependencies: { fetchImpl: () => { assert.fail('Database should not be called') } } })).status, 400)
  }
})
test('GET, origin asing, JSON rusak dan body besar ditolak', async () => {
  assert.equal((await invoke(payload(), { request: { method: 'GET' } })).status, 405)
  assert.equal((await invoke(payload(), { headers: { origin: 'https://foreign.example' } })).status, 403)
  assert.equal((await invoke(payload(), { headers: { 'content-type': 'text/plain' } })).status, 415)
  assert.equal((await invoke('{')).status, 400)
  assert.equal((await invoke('x'.repeat(8193))).status, 413)
})
test('konfigurasi kosong, kegagalan jaringan dan database tidak memberi sukses palsu', async () => {
  for (const dependencies of [{ env: {} }, { fetchImpl: async () => new Response(null, { status: 403 }) }, { fetchImpl: async () => { throw new Error('network') } }]) {
    const result = await invoke(payload(), { dependencies })
    assert.equal(result.status, 503)
    assert.equal(result.body.saved, undefined)
  }
})
