import { engine, Entity, Font, TextShape, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

export class Scoreboard {
  private readonly textEntity: Entity = engine.addEntity()
  private readonly scoreTitleEntity: Entity = engine.addEntity()
  private readonly scoreEntity: Entity = engine.addEntity()
  private readonly timeTitleEntity: Entity = engine.addEntity()
  private readonly timeEntity: Entity = engine.addEntity()

  private readonly textPreset = {
    text: '',
    fontSize: 12,
    font: Font.F_MONOSPACE,
    shadowColor: { r: 5, g: 0, b: 0.65 },
    shadowOffsetY: 50,
    shadowOffsetX: -50
  }

  constructor() {
    Transform.create(this.textEntity, {
      position: Vector3.create(46.75, 8.25, 32),
      rotation: Quaternion.fromAngleAxis(90, Vector3.create(0, 1, 0))
    })
    TextShape.create(this.textEntity, { ...this.textPreset })

    Transform.create(this.scoreTitleEntity, {
      position: Vector3.create(46.75, 9, 30),
      rotation: Quaternion.fromAngleAxis(90, Vector3.create(0, 1, 0))
    })
    TextShape.create(this.scoreTitleEntity, {
      text: '',
      fontSize: 6,
      font: Font.F_MONOSPACE
    })

    Transform.create(this.scoreEntity, {
      position: Vector3.create(46.75, 7.9, 30),
      rotation: Quaternion.fromAngleAxis(90, Vector3.create(0, 1, 0))
    })
    TextShape.create(this.scoreEntity, { ...this.textPreset })

    Transform.create(this.timeTitleEntity, {
      position: Vector3.create(46.75, 9, 34),
      rotation: Quaternion.fromAngleAxis(90, Vector3.create(0, 1, 0))
    })
    TextShape.create(this.timeTitleEntity, {
      text: '',
      fontSize: 6,
      font: Font.F_MONOSPACE
    })

    Transform.create(this.timeEntity, {
      position: Vector3.create(46.75, 7.9, 34),
      rotation: Quaternion.fromAngleAxis(90, Vector3.create(0, 1, 0))
    })
    TextShape.create(this.timeEntity, { ...this.textPreset })
  }

  public setText(text: string, fontSize: number = 12): void {
    this.clear()
    const textShape = TextShape.getMutable(this.textEntity)
    textShape.text = text
    textShape.fontSize = fontSize
  }

  public setScoreTime(time: number, score: number, maxScore: number): void {
    this.clear()
    TextShape.getMutable(this.scoreTitleEntity).text = 'goals:'
    TextShape.getMutable(this.scoreEntity).text = `${score}/${maxScore}`

    TextShape.getMutable(this.timeTitleEntity).text = 'time:'
    TextShape.getMutable(this.timeEntity).text = `0:${time > 9 ? time : `0${time}`}`
  }

  public clear(): void {
    TextShape.getMutable(this.textEntity).text = ''
    TextShape.getMutable(this.scoreTitleEntity).text = ''
    TextShape.getMutable(this.scoreEntity).text = ''
    TextShape.getMutable(this.timeTitleEntity).text = ''
    TextShape.getMutable(this.timeEntity).text = ''
  }
}
