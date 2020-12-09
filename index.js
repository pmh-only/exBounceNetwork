const { readFileSync, appendFileSync, mkdirSync, writeFileSync, existsSync } = require('fs')
const moment = require('moment')
if (!existsSync('./log')) mkdirSync('./log')
if (!existsSync('./log/log-' + moment().format('YYYY-MM-DD') + '.log')) writeFileSync('./log/log-' + moment().format('YYYY-MM-DD') + '.log', '')

// ---

let settings

const { parse } = require('yaml')
const bouncy = require('bouncy')
const knex = require('knex')
const uuid = require('uuid').v4

getSetting()
setInterval(getSetting, 1000)

const gpio = settings.gpio ? require('gpio') : { DIRECTION: { OUT: 0 }, export: () => ({ set: () => {} }) }
const pin2 = gpio.export(27, { direction: gpio.DIRECTION.OUT })

const s1 = bouncy(mtx)
const s2 = settings.ssl ? bouncy({ cert: readFileSync('./cert/cert.pem').toString('utf-8'), key: readFileSync('./cert/key.pem').toString('utf-8') }, mtx) : null

s1.listen(80)
if (s2) s2.listen(443)

if (settings.webmgr) require('./webmgr')

const db = knex({ client: 'mysql', connection: {
  host: 'localhost',
  port: 3306,
  user: 'exbounce',
  database: 'exbounce'
}})

// ---

async function mtx (req, res, bounce) {
  pin2.set()
  setTimeout(() => pin2.set(0), 100)

  const code = uuid().slice(0, 10)

  const ip =
    req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.socket.remoteAddress
    || (req.connection.socket ? req.connection.socket.remoteAddress : null)

  const host = req.headers.host
  const rstr = settings.locale[req.socket.localPort !== 443 ? 'log' : 'slog'].replace('$ip', ip).replace('$host', host).replace('$code', code)
  const [blocked] = await db.select('*').where('ip', ip).from('blacklist')
  const target = settings.bounce[host]

  await db.insert({
    code, ip, method: req.method,
    host, headers: JSON.stringify(req.headers),
    target, blocked: !!blocked,
    onssl: req.socket.localPort === 443
  }).into('log')

  if (blocked) {
    res.end(settings.locale.blocked.replace('$ip', ip).replace('$host', host).replace('$code', code).replace('$reason', blocked.reason))
    log(rstr.replace('$togo', '[!blocked]'))
    return
  }

  if (!target) {
    res.end(settings.locale.notpermitted.replace('$ip', ip).replace('$host', host).replace('$code', code))
    log(rstr.replace('$togo', '[!no-permit]'))
    return
  }
  
  if (Number.isNaN(Number(target))) {
    res.end(target)
    log(rstr.replace('$togo', '[pre-written]'))
    return
  }

  bounce(target)
  log(rstr.replace('$togo', target))
}

// ---

function getSetting () {
  const raw = readFileSync('./settings.yaml', 'utf-8')
  settings = parse(raw)
  if (!settings.bounce) settings.bounce = {}
  if (!settings.blacklist) settings.blacklist = []
}

// ---
function log (str) {
  console.log(str)
  appendFileSync('./log/log-' + moment().format('YYYY-MM-DD') + '.log', str + '\n')
}
