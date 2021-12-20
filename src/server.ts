import { Server, WebSocket } from 'ws'
import { Messages } from './messages'

const users = new Map<string, WebSocket>()

const host = process.argv[2] || 'localhost'
const port = +process.argv[3] || 7981

const server = new Server({
  host, port
})

const broadcast = (message: string, filters: WebSocket[] = []) => server.clients.forEach(client => {
  if (client.readyState !== WebSocket.OPEN)
    return
  if (filters.length === 0 || filters.includes(client))
    return
  client.send(message)
})

server.on('connection', (ws, req) => {
  let uname: string = 'anonymous', pwd: string
  // 从请求头中获取用户名与密码
  const [type, token] = req.headers.authorization?.split(' ') as ['DIY', string]
  switch (type) {
    case 'DIY':
      [uname, pwd] = token.split('@')
      break
    default:
      ws.send('Unauthorized')
  }
  const uid = uname + '@' + req.socket.remoteAddress

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
})

console.log(`server is running on ws://${ host }:${ port }`)
