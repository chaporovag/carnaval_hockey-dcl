import { engine, Entity, GltfContainer, Transform, TransformType } from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'
import CANNON from 'cannon/build/cannon'
import { Materials, physWorld } from '../core/physWorld'
import { Vector3 } from '@dcl/sdk/math'
import resources from '../core/resources'

export class Puck {
  entity: Entity = engine.addEntity()
  body: CANNON.Body
  isFired: boolean = false
  isStarted: boolean = false

  constructor(transform: TransformType) {
    Transform.create(this.entity, transform)
    GltfContainer.create(this.entity, {
      src: resources.MODEL_PUCK
    })

    utils.triggers.addTrigger(this.entity, utils.LAYER_1, utils.NO_LAYERS, [{ type: 'sphere', radius: 0.5 }])
    const puckBody: CANNON.Body = new CANNON.Body({
      mass: 3, // kg
      position: new CANNON.Vec3(transform.position.x, transform.position.y, transform.position.z), // m
      shape: new CANNON.Cylinder(0.2, 0.2, 0.15, 4) // m (Create sphere shaped body with a radius of 0.2)
    })

    const groundMaterial = physWorld.getMaterial(Materials.GROUND)
    const puckMaterial = physWorld.createMaterial(Materials.PUCK)
    const puckContactMaterial = new CANNON.ContactMaterial(groundMaterial, puckMaterial, {
      friction: 0.0,
      restitution: 0.0
    })
    physWorld.getWorld().addContactMaterial(puckContactMaterial)

    puckBody.material = puckMaterial
    puckBody.linearDamping = 0.4
    puckBody.angularDamping = 0.4

    physWorld.getWorld().addBody(puckBody) // Add body to the world

    this.body = puckBody
    this.setFired(false)
  }

  // Switches between fired states
  public setFired(isFired: boolean): void {
    this.isFired = isFired
  }

  public start(): void {
    const mutable = Transform.getMutable(this.entity)
    mutable.scale = Vector3.One()
    this.isStarted = true
  }

  public stop(): void {
    const mutable = Transform.getMutable(this.entity)
    mutable.scale = Vector3.Zero()
    this.isStarted = false
    this.setFired(false)
  }

  public update(): void {
    if (this.isFired) {
      let transform = Transform.getMutable(this.entity)
      transform.position = this.body.position
    }
  }
}
