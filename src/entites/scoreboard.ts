import { engine, Entity, Font, TextShape, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

export class Scoreboard {
  private readonly entity: Entity = engine.addEntity()

  constructor(text: string = '') {
    Transform.create(this.entity, {
      position: Vector3.create(46.75, 8.25, 32),
      rotation: Quaternion.fromAngleAxis(90, Vector3.create(0, 1, 0))
    })

    TextShape.create(this.entity, {
      text: text,
      fontSize: 12,
      font: Font.F_MONOSPACE,
      shadowColor: { r: 5, g: 0, b: 0.65 },
      shadowOffsetY: 50,
      shadowOffsetX: -50
    })
  }

  public setText(text: string, fontSize: number = 12) {
    const textShape = TextShape.getMutable(this.entity)
    textShape.text = text
    textShape.fontSize = fontSize
  }
}
