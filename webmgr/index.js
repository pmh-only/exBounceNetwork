const PASSWD = '4a078d47346e22bf3bc3427e749b194fc44fcea2efdd11eef486175e7bfe4b24'

const io = require('socket.io')
const express = require('express')
const { createServer } = require('http')
const path = require('path').resolve()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const sha256 = require('sha256')
const randomStr = require('crypto-random-string')
const knex = require('knex')
const moment = require('moment')

const db = knex({ client: 'mysql', connection: { host: 'localhost', port: 3306, user: 'exbounce', database: 'exbounce' } })
const vd = randomStr({ length: 30 })
const app = express()
const srv = createServer(app)
const socketIo = io(srv)

app.use('/login.html', (_, res, next) => {
  res.cookie('token', '')
  next()
})
app.use('/login.html', express.static(path + '/webmgr/login.html'))
app.use('/assets', express.static(path + '/assets'))

app.use(cookieParser())
app.get('/', (req, res, next) => {
  if (!req.cookies.token) return res.redirect('/login.html')

  try {
    jwt.verify(req.cookies.token, vd)
  } catch (_) {
    return res.redirect('/login.html')
  }

  next()
})

app.use('/', express.urlencoded({ extended: false }))
app.post('/', (req, res) => {
  if (!req.body.passwd) return res.redirect('/login.html')
  if (sha256(req.body.passwd) !== PASSWD) return res.redirect('/login.html')

  res.cookie('token', jwt.sign({ data: true }, vd, { expiresIn: '1h' }), { maxAge: 3600000 })
  return res.redirect('/')
})

app.use(express.static(path + '/webmgr'))
srv.listen(5500, () => console.log('webmgr is on :5500'))

// -- socket
socketIo.on('connection', (socket) => {
  socket.on('regist', (token) => {
    let tokendata
    try {
      tokendata = jwt.verify(token, vd)
    } catch (_) {
      return socket.emit('regist', { success: false })
    }

    socket.emit('regist', { success: true })
    if (tokendata.data) {
      let lastdate = moment().format('YYYY-MM-DD 00:00:00')

      log()
      setInterval(log, 3000)

      async function log () {
        const datas = await db.select('*').from('log').where('logAt', '>', lastdate)
        socket.emit('data', datas)
        lastdate = moment().format('YYYY-MM-DD HH:mm:ss')
      }
    }
  })
})
