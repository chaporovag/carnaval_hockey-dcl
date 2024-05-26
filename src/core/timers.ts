import * as utils from '@dcl-sdk/utils'

interface IData {
  id: number
  delay: number
  count?: number
  immediately?: boolean
}

class Timers {
  private readonly list: Record<string, IData | null>

  constructor() {
    this.list = {}
  }

  public create(name: string, callback: () => void, data: Omit<IData, 'id'>): void {
    if (this.list[name]) {
      this.remove(name)
    }

    const id = utils.timers.setInterval(() => {
      const t = this.get(name)
      if (t && t.count !== undefined) {
        t.count += 1
      }
      callback()
    }, data.delay)

    this.list[name] = {
      id,
      count: 0,
      delay: data.delay
    }

    if (data.immediately) {
      const t = this.get(name)
      if (t && t.count !== undefined) {
        t.count += 1
      }
      callback()
    }
  }

  public remove(name: string): void {
    const timer = this.list[name]
    if (timer) {
      utils.timers.clearInterval(timer.id)
      this.list[name] = null
    }
  }

  public get(name: string): IData | null {
    return this.list[name]
  }
}

export const timers = new Timers()
