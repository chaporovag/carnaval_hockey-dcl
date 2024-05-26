import { engine, Entity, Font, TextShape, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

export class Scoreboard {
  private readonly entity: Entity = engine.addEntity()
  private timerId: number = 0

  constructor(text: string = '') {
    Transform.create(this.entity, {
      position: Vector3.create(46.75, 8.25, 32),
      rotation: Quaternion.fromAngleAxis(90, Vector3.create(0, 1, 0))
    })
    const rate = 6
    TextShape.create(this.entity, {
      text: text,
      // textColor: { r: 145/255, g: 44/255, b: 26/255, a: 1 },
      fontSize: 12,
      font: Font.F_MONOSPACE,
      shadowColor: { r: 0.85 * rate, g: 0, b: 0.109 * rate },
      shadowOffsetY: 50,
      shadowOffsetX: -50
    })
  }

  public setText(text: string) {
    TextShape.getMutable(this.entity).text = text
  }

  public startTimer(callback: () => void) {
    this.timerId = utils.timers.setInterval(callback, 1000)
  }

  public stopTimer() {
    utils.timers.clearInterval(this.timerId)
  }
}
