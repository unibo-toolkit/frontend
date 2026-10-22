#!/usr/bin/env node
// Read-only bridge from the local frontend to the prod API.
//
// The frontend already calls the new scraper endpoints, which prod does not
// serve yet. This bridge rewrites them to the legacy prod endpoints and passes
// everything else under /api/v1/ through unchanged, so `next dev` can run on real prod data:
//
//   /api/v1/courses/{id}/curricula/{cid}/subjects  ->  /api/v1/courses/{id}/subjects?curriculum_id={cid}
//   /api/v1/timetable/preview?subject_ids=a,b       ->  /api/v1/preview?subject_ids=a&subject_ids=b
//
// Only GET/HEAD under /api/v1/ are forwarded, only to TARGET, and only from this machine.
// Remove the rewrites once the scraper with the new endpoints is deployed.

import http from 'node:http'

const TARGET = (process.env.BRIDGE_TARGET || 'https://uniplanner.it').replace(/\/+$/, '')
const PORT = Number(process.env.BRIDGE_PORT || 8090)
const HOST = '127.0.0.1'
const API_PREFIX = '/api/v1/'

const SUBJECTS_RE = /^courses\/([^/]+)\/curricula\/([^/]+)\/subjects$/

function rewrite(path, params) {
  const subjects = path.match(SUBJECTS_RE)
  if (subjects) {
    const legacy = new URLSearchParams(params)
    legacy.set('curriculum_id', subjects[2])
    return { path: `courses/${subjects[1]}/subjects`, params: legacy }
  }

  if (path === 'timetable/preview') {
    const legacy = new URLSearchParams()
    for (const [key, value] of params) {
      if (key === 'subject_ids') {
        for (const id of value.split(',').filter(Boolean)) legacy.append(key, id)
      } else {
        legacy.append(key, value)
      }
    }
    return { path: 'preview', params: legacy }
  }

  return { path, params }
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

http
  .createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendJson(res, 405, { error: 'read_only_bridge', message: `${req.method} is not forwarded to prod` })
    }

    // Only the path and query of the request are used; any host in it is ignored.
    const incoming = new URL(req.url, 'http://bridge.invalid')
    if (!incoming.pathname.startsWith(API_PREFIX)) {
      return sendJson(res, 404, { error: 'not_found', message: 'Only /api/v1/ is forwarded' })
    }

    const { path, params } = rewrite(incoming.pathname.slice(API_PREFIX.length), incoming.searchParams)
    const query = params.toString()
    const target = `${TARGET}${API_PREFIX}${path}${query ? `?${query}` : ''}`

    try {
      const upstream = await fetch(target, {
        method: req.method,
        headers: {
          accept: req.headers.accept || 'application/json',
          'user-agent': 'UniPlanner-dev-bridge',
        },
      })
      const body = Buffer.from(await upstream.arrayBuffer())
      const rewritten = !target.endsWith(`${incoming.pathname}${incoming.search}`)
      console.log(`${upstream.status} ${incoming.pathname}${incoming.search}${rewritten ? `  ->  ${API_PREFIX}${path}${query ? `?${query}` : ''}` : ''}`)
      res.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'application/json',
      })
      res.end(body)
    } catch (error) {
      console.error(`502 ${incoming.pathname}:`, error)
      sendJson(res, 502, { error: 'bad_gateway', message: 'Upstream request failed' })
    }
  })
  .listen(PORT, HOST, () => console.log(`prod bridge: http://${HOST}:${PORT} -> ${TARGET} (read-only)`))
