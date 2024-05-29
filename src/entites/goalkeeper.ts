import { engine, Entity, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import CANNON from 'cannon/build/cannon'
import { Materials, physWorld } from '../core/physWorld'
import * as utils from '@dcl-sdk/utils'
import { InterpolationType } from '@dcl/asset-packs'
import resources from '../core/resources'

export class Goalkeeper {
  private readonly entity: Entity = engine.addEntity()
  private readonly player: Entity = engine.addEntity()
  private readonly debugEntity: Entity | null = null
  private readonly body: CANNON.Body

  private isReadyToPlay = false
  private interpolationType = InterpolationType.EASEOUTEBOUNCE

  private direction = 0

  private position = {
    base: Vector3.create(44, 2.5, 32),
    left: Vector3.create(44, 2.5, 30),
    right: Vector3.create(44, 2.5, 34)
  }

  constructor(debug: boolean = false) {
    Transform.create(this.entity, {
      position: this.position.base,
      scale: Vector3.scale(Vector3.One(), 0.5)
    })

    this.player = engine.addEntity()
    Transform.create(this.player, {
      parent: this.entity,
      scale: Vector3.Zero()
    })
    GltfContainer.create(this.player, {
      src: resources.MODEL_GOALKEEPER
    })

    const size = Vector3.create(1, 6, 2.5)
    const position = Transform.getMutable(this.entity).position

    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2))
    const body = new CANNON.Body({
      mass: 0,
      shape,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    })

    body.addShape(shape)
    body.material = physWorld.getMaterial(Materials.GROUND)
    physWorld.getWorld().addBody(body)

    if (debug) {
      this.debugEntity = utils.addTestCube(
        {
          position: body.position,
          scale: size,
          rotation: body.quaternion
        },
        undefined,
        undefined,
        { ...Color4.Green(), a: 0.75 },
        false,
        true
      )
    }

    this.body = body
  }

  public update(): void {
    if (this.isReadyToPlay) {
      const position = Transform.getMutable(this.entity).position
      this.body.position.set(position.x, position.y, position.z)
      if (this.debugEntity) {
        Transform.getMutable(this.debugEntity).position = position
      }
    }
  }

  public start(): void {
    if (!this.isReadyToPlay) {
      const position = Transform.get(this.entity).position
      this.body.position.set(position.x, position.y, position.z)
      Transform.getMutable(this.player).scale = Vector3.One()
      utils.tweens.startRotation(
        this.player,
        Quaternion.fromAngleAxis(90, Vector3.create(0, 0, 1)),
        Quaternion.fromAngleAxis(0, Vector3.create(0, 0, 1)),
        1.25,
        this.interpolationType,
        () => {
          this.isReadyToPlay = true
          this.move(1)
        }
      )
    }
  }

  public stop(): void {
    this.isReadyToPlay = false
    utils.tweens.stopTranslation(this.entity)
    utils.tweens.startRotation(
      this.player,
      Quaternion.fromAngleAxis(0, Vector3.create(0, 0, 1)),
      Quaternion.fromAngleAxis(90, Vector3.create(0, 0, 1)),
      0.75,
      this.interpolationType,
      () => this.reset()
    )
  }

  private move(speed: number): void {
    if (this.isReadyToPlay) {
      const position = Transform.getMutable(this.entity).position
      this.direction = this.direction < 0 ? 1 : -1
      utils.tweens.startTranslation(
        this.entity,
        position,
        this.direction === -1 ? this.position.left : this.position.right,
        speed,
        InterpolationType.LINEAR,
        () => {
          if (this.isReadyToPlay) {
            this.move(2)
          }
        }
      )
    }
  }

  private reset(): void {
    const basePosition = this.position.base
    const { x, y, z } = basePosition
    Transform.getMutable(this.entity).position = basePosition

    const transform = Transform.getMutable(this.player)
    transform.scale = Vector3.Zero()
    transform.rotation = Quaternion.fromAngleAxis(90, Vector3.create(0, 0, 1))

    this.body.position.set(x, y, z)
    if (this.debugEntity) {
      Transform.getMutable(this.debugEntity).position = basePosition
    }
  }
}
