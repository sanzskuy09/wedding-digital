import assert from 'node:assert/strict'
import readline from 'node:readline/promises'

// Input JSON melalui stdin; kunci tidak disimpan atau ditampilkan.
process.stdout.write('Ready for Supabase verification JSON on stdin.\n')
if (process.stdin.isTTY) process.stdin.setRawMode(true)
const reader = readline.createInterface({ input: process.stdin, terminal: false })
const config = JSON.parse((await reader[Symbol.asyncIterator]().next()).value)
reader.close()
if (process.stdin.isTTY) process.stdin.setRawMode(false)
const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]
console.log(JSON.stringify({ testIds: ids }))
const base = new URL('/rest/v1/rsvps', config.url)
const headers = { apikey: config.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
const payload = { id: ids[0], name: 'PENGUJIAN INTEGRASI RSVP', attendance: 'yes', guests: 3, message: 'Data sementara untuk verifikasi sistem.' }
async function send(data) {
  const response = await fetch(base, { method: 'POST', headers, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.log(JSON.stringify({ status: response.status, code: error.code, message: error.message }))
  }
  return response
}
assert.equal((await send(payload)).status, 201, 'Three guests should be stored')
assert.equal((await send(payload)).status, 409, 'Retry must be identified as duplicate without reading the row')
assert.equal((await send({ ...payload, id: ids[1], attendance: 'no', guests: 0 })).status, 201, 'Not attending should store zero guests')
assert.equal((await send({ ...payload, id: ids[2], guests: 4 })).ok, false, 'Four guests must be rejected')
assert.equal((await fetch(base, { headers: { apikey: config.key }, signal: AbortSignal.timeout(15000) })).ok, false, 'Anonymous clients must not read RSVPs')
console.log('Verified live Supabase insert, retry, guest limit and private data access.')
