const { createApp } = (/** @type {import('vue')} */ Vue)

const app = createApp({
  data() {
    return {
      /** @type {WebSocket} */
      client: null,
      users: new Set(),
      username: '',
      password: '',
      historyMessages: [],
      message: ''
    }
  },
  computed: {
    history() {
      return this.historyMessages.join('\n')
    }
  },
  methods: {
    printMessage(str) {
      this.historyMessages.push(str)
    },
    /**
     * init the websocket connection
     *
     * @param {string} url
     */
    initClient(url) {
      this.client = new WebSocket(url)

      this.client.onmessage = m => {
        const message = JSON.parse(m.data.toString())
        switch (message.t) {
          case 'HELLO':
            message.p.forEach(user => this.users.add(user))
            this.printMessage(`[I] ${ message.p.join(', ') } in room`)
            break
          case 'MESSAGE':
            this.printMessage(`[I] ${ message.p }`)
            break
          case 'USER_ADD':
            this.users.add(message.p)
            this.printMessage(`[I] ${ message.p } joined`)
            break
          case 'USER_DEL':
            this.users.delete(message.p)
            this.printMessage(`[I] ${ message.p } left`)
            break
        }
      }
    },
    login() {
      let url = `ws://${window.location.host}/ws`
      if (!this.username || !this.password)
        return

      const authorization = btoa(unescape(encodeURIComponent(`${this.username}:${this.password}`)))
      url += `?authorization=Basic ${authorization}`
      this.initClient(url)
    },
    send() {
      if (!this.client) {
        alert('You are not logged in')
        return
      }
      if (!this.message)
        return
      const msg = this.message.trim()
      if (!msg)
        return
      this.client.send(JSON.stringify({ t: 'MESSAGE', p: msg }))
      this.historyMessages.push(`[I] 我: ${ msg }`)
      this.message = ''
    }
  }
})

app
  .use(ElementPlus)
  .mount('#app')
