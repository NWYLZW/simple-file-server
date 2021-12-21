/** @type {WebSocket} */
let client = null

const
  users = new Set(),
  /** @type {HTMLTextAreaElement} */
  chat = document.querySelector('#chat'),
  /** @type {HTMLTextAreaElement} */
  message = document.querySelector('#message'),
  username = document.querySelector('#username'),
  password = document.querySelector('#password')

function printMessage(str) {
  chat.value += `${str}\n`
}

/**
 * init the websocket connection
 *
 * @param {string} url
 */
function initClient(url) {
  client = new WebSocket(url)

  client.onmessage = m => {
    const message = JSON.parse(m.data.toString())
    switch (message.t) {
      case 'HELLO':
        message.p.forEach(users.add.bind(users))
        printMessage(`[I] ${ message.p.join(', ') } in room`)
        break
      case 'MESSAGE':
        printMessage(`[I] ${ message.p }`)
        break
      case 'USER_ADD':
        users.add(message.p)
        printMessage(`[I] ${ message.p } joined`)
        break
      case 'USER_DEL':
        users.delete(message.p)
        printMessage(`[I] ${ message.p } left`)
        break
    }
  }
}

;(/** @type {HTMLButtonElement} */ login).addEventListener('click', () => {
  let url = `ws://${window.location.host}/ws`
  if (!username.value || !password.value)
    return

  const authorization = btoa(unescape(encodeURIComponent(`${username.value}:${password.value}`)))
  url += `?authorization=Basic ${authorization}`
  initClient(url)
})
;(/** @type {HTMLButtonElement} */ send).addEventListener('click', () => {
  if (!client) {
    alert('You are not logged in')
    return
  }
  if (!message.value)
    return
  const msg = message.value.trim()
  if (!msg)
    return
  client.send(JSON.stringify({ t: 'MESSAGE', p: msg }))
})
