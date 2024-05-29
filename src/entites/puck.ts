import { engine, Entity, GltfContainer, Transform, TransformType } from '@dcl/sdk/ecs';
import { LAYER_1, NO_LAYERS, triggers } from '@dcl-sdk/utils';
import { Materials, physWorld } from '../core/physWorld';
import { Vector3 } from '@dcl/sdk/math';
import CANNON from 'cannon/build/cannon';
import resources from '../core/resources';

export class Puck {
  private readonly _entity: Entity = engine.addEntity();
  private readonly _body: CANNON.Body;
  private _isActive: boolean = false;

  constructor(transform: TransformType) {
    Transform.create(this._entity, transform);
    GltfContainer.create(this._entity, {
      src: resources.MODEL_PUCK
    });

    triggers.addTrigger(this._entity, LAYER_1, NO_LAYERS, [{ type: 'sphere', radius: 0.5 }]);
    const body: CANNON.Body = new CANNON.Body({
      mass: 3,
      position: new CANNON.Vec3(transform.position.x, transform.position.y, transform.position.z),
      shape: new CANNON.Cylinder(0.2, 0.2, 0.15, 4)
    });

    const groundMaterial = physWorld.getMaterial(Materials.GROUND);
    const puckMaterial = physWorld.getMaterial(Materials.PUCK);
    const puckContactMaterial = new CANNON.ContactMaterial(groundMaterial, puckMaterial, {
      friction: 0.0,
      restitution: 0.0
    });
    physWorld.getWorld().addContactMaterial(puckContactMaterial);

    body.material = puckMaterial;
    body.linearDamping = 0.4;
    body.angularDamping = 0.4;

    physWorld.getWorld().addBody(body);

    this._body = body;
  }

  public setActive(isActive: boolean): void {
    this._isActive = isActive;
  }

  public start(): void {
    const mutable = Transform.getMutable(this._entity);
    mutable.scale = Vector3.One();
  }

  public stop(): void {
    this._isActive = false;
  }

  public update(): void {
    let transform = Transform.getMutable(this._entity);
    transform.position = this._body.position;
  }

  public get entity(): Entity {
    return this._entity;
  }

  public get body(): CANNON.Body {
    return this._body;
  }

  public get isActive(): boolean {
    return this._isActive;
  }
}
