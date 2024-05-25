import {Vector3} from '@dcl/sdk/math'
import CANNON from 'cannon/build/cannon'
import {engine, MeshRenderer, Transform} from '@dcl/sdk/ecs'

export enum Materials {
    GROUND = 'groundMaterial',
    WALL = 'wallMaterial',
    PUCK = 'puckMaterial'
}

class PhysWorld {
    public readonly world: CANNON.World
    public readonly groundPositionY = 2.3

    private debug: boolean = false
    public readonly materials: Record<string, CANNON.Material> = {}

    constructor() {
        const world = new CANNON.World()
        world.quatNormalizeSkip = 0
        world.quatNormalizeFast = false
        world.gravity.set(0, -9.82, 0) // m/s²

        const groundMaterial = this.createMaterial(Materials.GROUND)
        const groundContactMaterial = new CANNON.ContactMaterial(groundMaterial, groundMaterial, {
            friction: 0.0,
            restitution: 0.0
        })
        world.addContactMaterial(groundContactMaterial)

        // Create a ground plane and apply physics material
        const groundShape = new CANNON.Plane()
        const groundBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(
                0,
                this.groundPositionY,
                0
            ), // m
        })
        groundBody.addShape(groundShape)
        groundBody.material = groundMaterial
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
        world.addBody(groundBody)

        // Debug ground shape
        if (this.debug) {
            const myPlane = engine.addEntity()

            Transform.create(myPlane, {
                position: groundBody.position,
                rotation: groundBody.quaternion,
                scale: Vector3.scale(Vector3.One(), 10)
            })

            MeshRenderer.setPlane(myPlane)
        }

        this.world = world
    }

    public createMaterial(name: Materials): CANNON.Material {
        const material = new CANNON.Material(name)
        this.materials[name] = material
        return material
    }

    public getMaterial(name: Materials): CANNON.Material {
        return this.materials[name];
    }

    public setDebugDraw(value: boolean): void {
        this.debug = value
    }
}

export const physWorld = new PhysWorld();

