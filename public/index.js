const {
  ElMessage, ElNotification, ElMessageBox
} = (/** @type {import('element-plus')} */ ElementPlus)
const { createApp } = (/** @type {import('vue')} */ Vue)

const app = createApp({
  data() {
    return {
      /** @type {WebSocket} */
      client: null,
      loading: false,
      users: new Set(),
      username: '',
      password: '',
      historyMessages: [],
      message: '',
      receiveFileName: ''
    }
  },
  computed: {
    /** @type {string} */
    url() {
      return `ws://${window.location.host}/ws?authorization=Basic ${
        btoa(unescape(encodeURIComponent(`${this.username}:${this.password}`)))
      }`
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

      this.client.onmessage = e => {
        if (e.data instanceof Blob) {
          const a = document.createElement("a")
          a.href = URL.createObjectURL(
            new Blob([e.data], {
              type: e.data.type
            })
          )
          a.setAttribute('download', this.receiveFileName)
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          return
        }
        const message = JSON.parse(e.data.toString())
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
            ElNotification.success({
              title: 'User joined',
              message: message.p
            })
            break
          case 'USER_DEL':
            this.users.delete(message.p)
            ElNotification.warning({
              title: 'User left',
              message: message.p
            })
            break
          case 'SEND_FILE':
            selFile.files[0].arrayBuffer().then(buffer => {
              const fileSender = new WebSocket(`ws://${window.location.host}/ws/users/${message.p}/send?authorization=Basic ${
                btoa(unescape(encodeURIComponent(`${this.username}:${this.password}`)))
              }`)
              fileSender.onopen = () => {
                fileSender.send(buffer)
                fileSender.close()
                this.loading = false
                selFile.files = new DataTransfer().files
              }
            })
            break
          case 'RECEIVE_FILE':
            const {
              filename, uid
            } = message.p
            ElMessageBox.alert(`${ uid } want to send ${ filename } file to you`, 'Confirm', {
              confirmButtonText: 'Confirm'
            }).then(() => {
              this.receiveFileName = filename
              ElMessage.info('File is sending...')
              this.client.send(JSON.stringify({
                t: 'RECEIVE_FILE',
                p: uid
              }))
            })
        }
      }
    },
    login() {
      if (!this.username || !this.password)
        return
      this.initClient(this.url)
    },
    verifySend() {
      if (!this.client) {
        throw new Error('You are not logged in')
      }
    },
    send() {
      try {
        this.verifySend()
      } catch (e) {
        ElMessage.warning(e.toString())
      }
      if (!this.message)
        return
      const msg = this.message.trim()
      if (!msg)
        return
      this.client.send(JSON.stringify({ t: 'MESSAGE', p: msg }))
      this.printMessage(`[I] 我: ${ msg }`)
      this.message = ''
    },
    sendFile(uid) {
      this.loading = true
      ;(/** @type {HTMLInputElement} */ selFile).click()
      selFile.onchange = () => {
        if (selFile.files.length > 0) {
          this.client.send(JSON.stringify({ t: 'SEND_FILE', p: {
            uid,
            filename: selFile.files[0].name
          } }))
        }
      }
    }
  }
})

app
  .use(ElementPlus)
  .mount('#app')
