import { WebSocket } from 'ws'
import * as fs from 'fs'

const ws = new WebSocket('ws://foo:bar@localhost:7981/ws/users/bar@127.0.0.1/send')

ws.on('open', () => {
  ws.send(fs.readFileSync('.gitignore'))
})
