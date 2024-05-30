import { Color4, Vector3 } from '@dcl/sdk/math';
import CANNON from 'cannon/build/cannon';
import { addTestCube } from '@dcl-sdk/utils';

interface Params {
  size: Vector3;
  position: Vector3;
  rotation?: number;
}

export class PhysFactory {
  private readonly world: CANNON.World;
  private readonly material: CANNON.Material;
  private readonly debug: boolean;

  constructor(world: CANNON.World, material: CANNON.Material, debug: boolean = false) {
    this.world = world;
    this.material = material;
    this.debug = debug;
  }

  public create({ size, position, rotation }: Params): CANNON.Body {
    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    const body = new CANNON.Body({
      mass: 0,
      shape,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });

    if (rotation) {
      const angle = (rotation / 180) * Math.PI;
      body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
    }

    body.addShape(shape);
    body.material = this.material;
    this.world.addBody(body);

    if (this.debug) {
      addTestCube(
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
      );
    }

    return body;
  }
}
