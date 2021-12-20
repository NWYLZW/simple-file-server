export namespace Messages {
  export type Server = {
    t: 'HELLO',
    p: string[]
  } | {
    t: 'USER_ADD',
    p: string
  } | {
    t: 'USER_DEL',
    p: string
  } | {
    t: 'MESSAGE',
    p: string
  }
  export type Client = {
    t: 'MESSAGE',
    p: string
  }
}
