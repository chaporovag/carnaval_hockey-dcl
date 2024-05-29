import { Puck } from './puck'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { Entity, Transform } from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'

class Pool {
  private readonly MAX_POOL: number = 15
  private pool: Puck[] = []
  private allObjects: Puck[] = []
  private activeObjects: Puck[] = []

  public get(): Puck {
    let puck: Puck

    if (this.pool.length > 0) {
      puck = this.pool.pop() as Puck
      const { body, entity } = puck
      body.velocity.setZero()
      body.angularVelocity.setZero()
      let transform = Transform.getMutable(entity)
      transform.position = Vector3.create(0, 0.05, 2.5)
      transform.scale = Vector3.One()
      // transform.scale = Vector3.scale(Vector3.One(), 3)
    } else if (this.activeObjects.length < this.MAX_POOL) {
      puck = new Puck({
        position: Vector3.create(0, 0.05, 2.5),
        rotation: Quaternion.Zero(),
        scale: Vector3.One()
        // scale: Vector3.scale(Vector3.One(), 3)
      })
      this.allObjects.push(puck)
    } else {
      throw new Error('Maximum number of game objects reached')
    }

    this.activate(puck)

    return puck
  }

  private activate(puck: Puck) {
    this.activeObjects.push(puck)
    utils.timers.setTimeout(() => this.deactivate(puck), 5000)
  }

  private deactivate(puck: Puck) {
    this.activeObjects = this.activeObjects.filter((activeObject) => activeObject !== puck)
    puck.setFired(false)
    this.pool.push(puck)
  }

  public update(): void {
    this.activeObjects.forEach((activeObject) => activeObject.update())
  }

  public clear(): void {
    this.allObjects.forEach((puck) => {
      let transform = Transform.getMutable(puck.entity)
      transform.scale = Vector3.Zero()
      puck.setFired(false)
    })
  }

  public getBy(entity: Entity): Puck | undefined {
    return this.allObjects.find((puck) => puck.entity === entity)
  }
}

export const pool = new Pool()
