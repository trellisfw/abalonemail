declare module 'timed-cache' {
  type Options = {
    defaultTtl?: number
  }
  export default class Cache {
    constructor (options?: Options)
    put (key: string | object, value: any): void
    get (key: string | object): any
    remove (key: string | object): void
  }
}

// Make TS understand assert better
declare module 'assert' {
    function internal (value: any, message?: string | Error): asserts value
}
