import {Color4, Vector3} from '@dcl/sdk/math'
import CANNON from 'cannon/build/cannon'
import * as utils from '@dcl-sdk/utils'

interface Params {
    size: Vector3,
    position: Vector3,
    rotationX?: number
    rotationY?: number
    rotationZ?: number
}

export class PhysFactory {
    private readonly world: CANNON.World
    private readonly material: CANNON.Material
    private readonly isDebugging: boolean

    constructor(world: CANNON.World, material: CANNON.Material, isDebugging: boolean = false) {
        this.world = world
        this.material = material
        this.isDebugging = isDebugging
    }

    create({size, position, rotationX, rotationY, rotationZ}: Params): void {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2))
        const body = new CANNON.Body({
            mass: 0,
            shape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
        })

        if (rotationX) {
            const angle = rotationX / 180 * Math.PI
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), angle);
        }
        if (rotationY) {
            const angle = rotationY / 180 * Math.PI
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), angle);
        }
        if (rotationZ) {
            const angle = rotationZ / 180 * Math.PI
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,0,1), angle);
        }

        body.addShape(shape)
        body.material = this.material
        this.world.addBody(body)

        if (this.isDebugging) {
            utils.addTestCube({
                position: body.position,
                scale: size,
                rotation: body.quaternion
            }, undefined, undefined, {...Color4.Green(), a: 0.75}, false, true)
        }
    }
}
