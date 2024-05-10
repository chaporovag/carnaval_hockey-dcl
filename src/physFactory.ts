import {Vector3} from '@dcl/sdk/math'
import CANNON from 'cannon/build/cannon'

interface Params {
    size: Vector3,
    position: Vector3,
    rotation: number
}

export class PhysFactory {
    private readonly world: CANNON.World
    private readonly material: CANNON.Material

    constructor(world: CANNON.World, material: CANNON.Material) {
        this.world = world
        this.material = material
    }

    create({size, position, rotation}: Params): void {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2))
        const body = new CANNON.Body({
            mass: 0,
            shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
        })

        const angle = rotation / 180 * Math.PI
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), angle);

        body.addShape(shape)
        body.material = this.material
        this.world.addBody(body)

        // utils.addTestCube({position: body.position, scale: size, rotation: body.quaternion }, undefined, undefined, { ...Color4.Black(), a: 0.75 })
    }
}
