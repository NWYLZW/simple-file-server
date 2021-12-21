import { WebSocket } from 'ws'
import { Messages } from './messages'
import * as fs from 'fs'

const [url] = process.argv.slice(2)

const [, uname, pwd] = /^ws:\/\/(.*):(.*)@/.exec(url) || []

const users = new Set<string>()

const client = new WebSocket(url)

client.on('message', (m, isBinary) => {
  if (isBinary) {
    fs.writeFileSync('.temp.txt', m as Buffer)
    return
  }
  const message = JSON.parse(m.toString()) as Messages.Server
  switch (message.t) {
    case 'HELLO':
      message.p.forEach(users.add.bind(users))
      console.log(`[I] ${ message.p.join(', ') } in room`)
      break
    case 'MESSAGE':
      console.log(`[I] ${ message.p }`)
      break
    case 'USER_ADD':
      users.add(message.p)
      console.log(`[I] ${ message.p } joined`)
      break
    case 'USER_DEL':
      users.delete(message.p)
      console.log(`[I] ${ message.p } left`)
      break
  }
})

process.stdin.on('data', d => {
  const message = d.toString().trim()
  if (message.length === 0) return
  client.send(JSON.stringify({
    t: 'MESSAGE',
    p: message
  }))
})
