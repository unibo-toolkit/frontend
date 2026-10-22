#!/usr/bin/env node
// Read-only bridge from the local frontend to the prod API.
//
// The frontend already calls the new scraper endpoints, which prod does not
// serve yet. This bridge rewrites them to the legacy prod endpoints and passes
// everything else through unchanged, so `next dev` can run on real prod data:
//
//   /api/v1/courses/{id}/curricula/{cid}/subjects  ->  /api/v1/courses/{id}/subjects?curriculum_id={cid}
//   /api/v1/timetable/preview?subject_ids=a,b       ->  /api/v1/preview?subject_ids=a&subject_ids=b
//
// Only GET/HEAD are forwarded: nothing local can write to prod.
// Remove the rewrites once the scraper with the new endpoints is deployed.

import http from 'node:http'

const TARGET = process.env.BRIDGE_TARGET || 'https://uniplanner.it'
const PORT = Number(process.env.BRIDGE_PORT || 8090)

const SUBJECTS_RE = /^\/api\/v1\/courses\/([^/]+)\/curricula\/([^/]+)\/subjects$/

function rewrite(url) {
  const subjects = url.pathname.match(SUBJECTS_RE)
  if (subjects) {
    const legacy = new URL(`/api/v1/courses/${subjects[1]}/subjects`, url)
    legacy.search = url.search
    legacy.searchParams.set('curriculum_id', subjects[2])
    return legacy
  }

  if (url.pathname === '/api/v1/timetable/preview') {
    const legacy = new URL('/api/v1/preview', url)
    for (const [key, value] of url.searchParams) {
      if (key === 'subject_ids') {
        for (const id of value.split(',').filter(Boolean)) legacy.searchParams.append(key, id)
      } else {
        legacy.searchParams.append(key, value)
      }
    }
    return legacy
  }

  return url
}

http
  .createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'read_only_bridge', message: `${req.method} is not forwarded to prod` }))
      return
    }

    const target = rewrite(new URL(req.url, TARGET))
    try {
      const upstream = await fetch(target, {
        method: req.method,
        headers: {
          accept: req.headers.accept || 'application/json',
          'user-agent': 'UniPlanner-dev-bridge',
        },
      })
      const body = Buffer.from(await upstream.arrayBuffer())
      console.log(`${upstream.status} ${req.url}${target.href.endsWith(req.url) ? '' : `  ->  ${target.pathname}${target.search}`}`)
      res.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'application/json',
      })
      res.end(body)
    } catch (error) {
      console.error(`502 ${req.url}: ${error}`)
      res.writeHead(502, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'bad_gateway', message: String(error) }))
    }
  })
  .listen(PORT, () => console.log(`prod bridge: http://localhost:${PORT} -> ${TARGET} (read-only)`))
