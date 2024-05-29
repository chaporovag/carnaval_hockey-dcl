import { engine, Entity, GltfContainer, Transform, TransformType } from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'
import CANNON from 'cannon/build/cannon'
import { Materials, physWorld } from '../core/physWorld'
import { Vector3 } from '@dcl/sdk/math'
import resources from '../core/resources'

export class Puck {
  private readonly _entity: Entity = engine.addEntity()
  private readonly _body: CANNON.Body
  private _isFired: boolean = false
  private _isStarted: boolean = false
  private _isActive: boolean = false

  constructor(transform: TransformType) {
    Transform.create(this._entity, transform)
    GltfContainer.create(this._entity, {
      src: resources.MODEL_PUCK
    })

    utils.triggers.addTrigger(this._entity, utils.LAYER_1, utils.NO_LAYERS, [{ type: 'sphere', radius: 0.5 }])
    const body: CANNON.Body = new CANNON.Body({
      mass: 3, // kg
      position: new CANNON.Vec3(transform.position.x, transform.position.y, transform.position.z), // m
      shape: new CANNON.Cylinder(0.2, 0.2, 0.15, 4)
    })

    const groundMaterial = physWorld.getMaterial(Materials.GROUND)
    const puckMaterial = physWorld.getMaterial(Materials.PUCK)
    // const puckMaterial = physWorld.createMaterial(Materials.PUCK)
    const puckContactMaterial = new CANNON.ContactMaterial(groundMaterial, puckMaterial, {
      friction: 0.0,
      restitution: 0.0
    })
    physWorld.getWorld().addContactMaterial(puckContactMaterial)

    body.material = puckMaterial
    body.linearDamping = 0.4
    body.angularDamping = 0.4

    physWorld.getWorld().addBody(body)

    this._body = body
  }

  public setFired(isFired: boolean): void {
    this._isFired = isFired
  }

  public start(): void {
    const mutable = Transform.getMutable(this._entity)
    mutable.scale = Vector3.One()
    this._isStarted = true
  }

  public stop(): void {
    const mutable = Transform.getMutable(this._entity)
    // mutable.scale = Vector3.Zero()
    this._isStarted = false
    this._isFired = false
  }

  /*  public activate(): void {
    this._isActive = true
  }

  public deactivate(): void {
    this._isActive = false
  }*/

  public update(): void {
    // if (this._isFired) {
    let transform = Transform.getMutable(this._entity)
    transform.position = this._body.position
    // }
  }

  public get entity(): Entity {
    return this._entity
  }

  public get body(): CANNON.Body {
    return this._body
  }

  public get isFired(): boolean {
    return this._isFired
  }

  /*public get isStarted(): boolean {
    return this._isStarted
  }*/
}
