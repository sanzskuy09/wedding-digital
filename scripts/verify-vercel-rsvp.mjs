import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const deployment = process.argv[2]
if (!deployment) throw new Error('Provide the deployment URL to test')
const origin = new URL(deployment).origin
const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]
console.log(JSON.stringify({ testIds: ids }))
const data = { id: ids[0], name: 'PENGUJIAN VERCEL RSVP', attendance: 'yes', guests: 3, message: 'Data sementara untuk verifikasi sistem.', website: '' }
function invoke(payload, method = 'POST', requestOrigin = origin) {
  const args = ['vercel', 'curl', '/api/rsvp', '--deployment', deployment, '--', '--silent', '--show-error', '--request', method, '--header', 'Content-Type: application/json', '--header', `Origin: ${requestOrigin}`, '--write-out', '\n__RSVP_HTTP_STATUS__:%{http_code}']
  if (method === 'POST') args.push('--data', JSON.stringify(payload))
  const result = spawnSync('npx', args, { encoding: 'utf8', timeout: 30000 })
  if (result.status !== 0) throw new Error(result.stderr || 'Vercel request failed')
  const [raw, status] = result.stdout.split('\n__RSVP_HTTP_STATUS__:')
  const response = { status: Number(status?.trim()), body: JSON.parse(raw) }
  console.log(JSON.stringify(response))
  return response
}
assert.equal(invoke(data).status, 201)
assert.equal(invoke(data).status, 201)
assert.equal(invoke({ ...data, id: ids[1], attendance: 'no' }).status, 201)
assert.equal(invoke({ ...data, id: ids[2], guests: 4 }).status, 400)
assert.equal(invoke(data, 'GET').status, 405)
assert.equal(invoke(data, 'POST', 'https://foreign.example').status, 403)
console.log('Verified production Vercel RSVP persistence, retry, guest limit and origin validation.')
