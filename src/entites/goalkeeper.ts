import { engine, Entity, GltfContainer, Transform } from '@dcl/sdk/ecs';
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math';
import CANNON from 'cannon/build/cannon';
import { Materials, physWorld } from '../core/physWorld';
import { addTestCube, tweens } from '@dcl-sdk/utils';
import { InterpolationType } from '@dcl/asset-packs';
import resources from '../core/resources';

export class Goalkeeper {
  private readonly entity: Entity;
  private readonly player: Entity;
  private readonly debugEntity!: Entity;
  private readonly body: CANNON.Body;

  private interpolationType = InterpolationType.EASEOUTEBOUNCE;
  private isReadyToPlay = false;
  private direction = 0;
  private position = {
    base: Vector3.create(44, 2.5, 32),
    left: Vector3.create(44, 2.5, 30),
    right: Vector3.create(44, 2.5, 34)
  };

  constructor(debug: boolean = false) {
    this.entity = this.createEntity(this.position.base);
    this.player = this.createPlayerEntity(this.entity);
    this.body = this.createBody(this.entity);

    if (debug) {
      this.debugEntity = this.createDebugEntity(this.body);
    }
  }

  private createEntity(position: Vector3): Entity {
    const entity = engine.addEntity();
    Transform.create(entity, { position });
    return entity;
  }

  private createPlayerEntity(parent: Entity): Entity {
    const player = engine.addEntity();
    Transform.create(player, {
      parent,
      scale: Vector3.Zero()
    });
    GltfContainer.create(player, {
      src: resources.MODEL_GOALKEEPER
    });
    return player;
  }

  private createBody(entity: Entity): CANNON.Body {
    const size = Vector3.create(1, 6, 2.5);
    const position = Transform.getMutable(entity).position;
    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    const body = new CANNON.Body({
      mass: 0,
      shape,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });
    body.addShape(shape);
    body.material = physWorld.getMaterial(Materials.GROUND);
    physWorld.getWorld().addBody(body);
    return body;
  }

  private createDebugEntity(body: CANNON.Body): Entity {
    return addTestCube(
      {
        position: body.position,
        scale: Vector3.create(1, 6, 2.5),
        rotation: body.quaternion
      },
      undefined,
      undefined,
      { ...Color4.Green(), a: 0.75 },
      false,
      true
    );
  }

  public update(): void {
    if (this.isReadyToPlay) {
      const position = Transform.getMutable(this.entity).position;
      this.body.position.set(position.x, position.y, position.z);
      if (this.debugEntity) {
        Transform.getMutable(this.debugEntity).position = position;
      }
    }
  }

  public start(): void {
    if (!this.isReadyToPlay) {
      const position = Transform.get(this.entity).position;
      this.body.position.set(position.x, position.y, position.z);
      Transform.getMutable(this.player).scale = Vector3.One();
      tweens.startRotation(
        this.player,
        Quaternion.fromAngleAxis(90, Vector3.create(0, 0, 1)),
        Quaternion.fromAngleAxis(0, Vector3.create(0, 0, 1)),
        1.25,
        this.interpolationType,
        () => {
          this.isReadyToPlay = true;
          this.move(1);
        }
      );
    }
  }

  public stop(): void {
    this.isReadyToPlay = false;
    tweens.stopTranslation(this.entity);
    tweens.startRotation(
      this.player,
      Quaternion.fromAngleAxis(0, Vector3.create(0, 0, 1)),
      Quaternion.fromAngleAxis(90, Vector3.create(0, 0, 1)),
      0.75,
      this.interpolationType,
      () => this.reset()
    );
  }

  private move(speed: number): void {
    if (this.isReadyToPlay) {
      const position = Transform.getMutable(this.entity).position;
      this.direction = this.direction < 0 ? 1 : -1;
      tweens.startTranslation(
        this.entity,
        position,
        this.direction === -1 ? this.position.left : this.position.right,
        speed,
        InterpolationType.LINEAR,
        () => {
          if (this.isReadyToPlay) {
            this.move(2);
          }
        }
      );
    }
  }

  private reset(): void {
    const basePosition = this.position.base;
    const { x, y, z } = basePosition;
    Transform.getMutable(this.entity).position = basePosition;

    const transform = Transform.getMutable(this.player);
    transform.scale = Vector3.Zero();
    transform.rotation = Quaternion.fromAngleAxis(90, Vector3.create(0, 0, 1));

    this.body.position.set(x, y, z);
    if (this.debugEntity) {
      Transform.getMutable(this.debugEntity).position = basePosition;
    }
  }
}
