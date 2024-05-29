import * as utils from '@dcl-sdk/utils';

class Timer {
  constructor(
    public id: number,
    public delay: number,
    public count: number = 0
  ) {}
}

class Timers {
  private timers: Record<string, Timer> = {};

  public create(
    name: string,
    callback: () => void,
    { delay, maxCount, immediately }: { delay: number; maxCount?: number; immediately?: boolean }
  ): void {
    this.remove(name);

    const timerId = utils.timers.setInterval(() => {
      const timer = this.timers[name];
      if (timer && maxCount && timer.count >= maxCount) {
        this.remove(name);
      } else {
        timer && timer.count++;
        callback();
      }
    }, delay);

    this.timers[name] = new Timer(timerId, delay);

    if (immediately) {
      this.timers[name].count++;
      callback();
    }
  }

  public remove(name: string): void {
    const timer = this.timers[name];
    if (timer) {
      utils.timers.clearInterval(timer.id);
      delete this.timers[name];
    }
  }

  public get(name: string): Timer {
    return this.timers[name];
  }
}

export const timers = new Timers();
