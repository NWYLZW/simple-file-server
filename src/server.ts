import Koa from 'koa'
import route from 'koa-route'
import websocketMiddleware from 'koa-websocket'
import staticMiddleware from 'koa-static'
import { WebSocket } from 'ws'
import { Messages } from './messages'

const host = process.argv[2] || 'localhost'
const port = +process.argv[3] || 7981

const users = new Map<string, WebSocket>()

const app = websocketMiddleware(new Koa())

const broadcast = (message: string, filters: WebSocket[] = []) => {
  const wss = app.ws.server
  if (!wss) return
  wss.clients.forEach(client => {
    if (client.readyState !== WebSocket.OPEN)
      return
    if (filters.length === 0 || filters.includes(client))
      return
    client.send(message)
  })
}

app.use(staticMiddleware(process.cwd() + '/public'))

app.ws.use(route.all('/ws', ({ websocket: ws, request: req }) => {
  try {
    const { authorization } = Object.assign({
      authorization:
        req.headers['proxy-authorization'] ||
        req.headers.authorization ||
        req.query.authorization ||
        ''
    }, req.headers)
    if (!authorization) {
      ws.close(4003, 'Unauthorized')
      return
    }

    let uid = ''
    // 从请求头中获取用户名与密码
    const [type, token] = authorization?.split(' ') as ['Basic', string]
    switch (type) {
      case 'Basic':
        const [uname, pwd] = Buffer.from(token, 'base64').toString().split(':')
        uid = `${ uname }@${ req.socket.remoteAddress }`
        break
      default:
        ws.close(4003, 'Unauthorized')
        return
    }

    console.log(`[I] ${ uid } is connected.`)
    users.set(uid, ws)
    // 连接建立时发送当前在线用户列表
    ws.send(JSON.stringify({
      t: 'HELLO',
      p: Array.of(...users.keys())
    }))
    broadcast(JSON.stringify({
      t: 'USER_ADD',
      p: uid
    }), [ws])

    ws.on('message', m => {
      const message = JSON.parse(m.toString()) as Messages.Client
      switch (message.t) {
        case 'MESSAGE':
          broadcast(JSON.stringify({
            t: 'MESSAGE',
            p: `${ uid }: ${ message.p }`
          }), [ws])
          break
      }
    })
    ws.on('close', () => {
      console.log(`[I] ${ uid } is disconnected.`)
      users.delete(uid)
      broadcast(JSON.stringify({
        t: 'USER_DEL',
        p: uid
      }), [ws])
    })
  } catch (e) {
    console.log(e)
  }
}))

app.listen(port, host, () => {
  console.log(`server is running on http://${ host }:${ port }`)
})
