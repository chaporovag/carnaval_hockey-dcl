import { Puck } from './puck';
import { Quaternion, Vector3 } from '@dcl/sdk/math';
import { Entity, Transform, TransformType } from '@dcl/sdk/ecs';
import { timers } from '@dcl-sdk/utils';

export class Pool {
  private readonly POOL_SIZE: number = 10;
  private readonly TRANSFORM: TransformType = {
    position: Vector3.create(0, 0.05, 2.5),
    rotation: Quaternion.Zero(),
    scale: Vector3.One()
  };

  private readonly _poolList: Puck[] = [];
  private readonly _allList: Puck[] = [];
  private _activeList: Puck[] = [];

  public get(): Puck {
    let puck: Puck;

    if (this._poolList.length > 0) {
      puck = this._poolList.pop() as Puck;
      const { body, entity } = puck;
      body.velocity.setZero();
      body.angularVelocity.setZero();
      let transform = Transform.getMutable(entity);
      transform.position = this.TRANSFORM.position;
      transform.scale = this.TRANSFORM.scale;
    } else if (this._activeList.length < this.POOL_SIZE) {
      puck = new Puck(this.TRANSFORM);
      this._allList.push(puck);
    } else {
      throw new Error('Maximum number of packs reached');
    }

    this.activate(puck);

    return puck;
  }

  private activate(puck: Puck) {
    this._activeList.push(puck);
    timers.setTimeout(() => this.deactivate(puck), 5000);
  }

  private deactivate(puck: Puck) {
    this._activeList = this._activeList.filter((activeObject) => activeObject !== puck);
    puck.setActive(false);
    this._poolList.push(puck);
  }

  public update(): void {
    this._activeList.forEach((activeObject) => activeObject.update());
  }

  public clear(): void {
    this._allList.forEach((puck) => {
      let transform = Transform.getMutable(puck.entity);
      transform.scale = Vector3.Zero();
      puck.setActive(false);
    });
  }

  public getBy(entity: Entity): Puck | undefined {
    return this._allList.find((puck) => puck.entity === entity);
  }
}
