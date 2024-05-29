import { Vector3 } from '@dcl/sdk/math'
import CANNON from 'cannon/build/cannon'
import { engine, MeshRenderer, Transform } from '@dcl/sdk/ecs'

export enum Materials {
  GROUND = 'groundMaterial',
  WALL = 'wallMaterial',
  PUCK = 'puckMaterial'
}

class PhysWorld {
  private readonly FIXED_TIME_STEPS = 1.0 / 60.0
  private readonly MAX_TIME_STEPS = 3
  private readonly GROUND_POSITION = new CANNON.Vec3(0, 2.3, 0)

  private readonly materials: Record<string, CANNON.Material> = {}
  private readonly world: CANNON.World

  private debug: boolean = false

  constructor() {
    const world = new CANNON.World()
    world.quatNormalizeSkip = 0
    world.quatNormalizeFast = false
    world.gravity.set(0, -9.82, 0) // m/s²

    const puckMaterial = this.createMaterial(Materials.PUCK)
    const wallMaterial = this.createMaterial(Materials.WALL)

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
      position: this.GROUND_POSITION
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

  public update(dt: number): void {
    this.world.step(this.FIXED_TIME_STEPS, dt, this.MAX_TIME_STEPS)
  }

  public createMaterial(name: Materials): CANNON.Material {
    const material = new CANNON.Material(name)
    this.materials[name] = material
    return material
  }

  public getMaterial(name: Materials): CANNON.Material {
    return this.materials[name]
  }

  public getWorld(): CANNON.World {
    return this.world
  }

  public getWorldPosition(): CANNON.Vec3 {
    return this.GROUND_POSITION
  }

  public setDebugDraw(value: boolean): void {
    this.debug = value
  }
}

export const physWorld = new PhysWorld()
