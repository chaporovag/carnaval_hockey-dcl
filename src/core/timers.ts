import * as utils from '@dcl-sdk/utils'

interface InputData {
  delay: number
  maxCount?: number
  immediately?: boolean
}

interface IData {
  id: number
  delay: number
  count: number
}

class Timers {
  private readonly list: Record<string, IData | null>

  constructor() {
    this.list = {}
  }

  public create(name: string, callback: () => void, data: InputData): void {
    if (this.list[name]) {
      this.remove(name)
    }

    const id = utils.timers.setInterval(() => {
      if (data.maxCount) {
        const t = this.get(name)
        if (t && t.count !== undefined && t.count >= data.maxCount) {
          this.remove(name)
        } else {
          t && t.count++
        }
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
      t && t.count++
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
