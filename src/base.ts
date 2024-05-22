import {engine, Entity, GltfContainer, Transform} from '@dcl/sdk/ecs'
import {Vector3} from '@dcl/sdk/math'
import {PhysFactory} from './physFactory'
import {Materials, physWorld} from './physWorld'
import CANNON from 'cannon/build/cannon'

export class Base {
    private readonly entity: Entity = engine.addEntity()

    constructor(debug: boolean = false) {
        const world = physWorld.world
        const puckMaterial = physWorld.getMaterial(Materials.PUCK)
        const wallMaterial = physWorld.createMaterial(Materials.WALL)
        const wallContactMaterial = new CANNON.ContactMaterial(wallMaterial, puckMaterial, {
            friction: 0.0,
            restitution: 0.6
        })
        world.addContactMaterial(wallContactMaterial)

        GltfContainer.create(this.entity, {
            src: 'models/Test_Game_V1.glb'
        })
        Transform.create(this.entity, { position: Vector3.create(32, 0, 32), scale: Vector3.scale(Vector3.One(), 0.7)})

        const physFactory = new PhysFactory(world, wallMaterial, debug)
        physFactory.create({
            size: Vector3.create(34.2, 4, 0.7),
            position: Vector3.create(28.35, 2, 24.37),
        })
        physFactory.create({
            size: Vector3.create(2, 4, 0.7),
            position: Vector3.create(46.45, 2, 24.5),
            rotationY: -9,
        })
        physFactory.create({
            size: Vector3.create(2.5, 4, 0.7),
            position: Vector3.create(48.48, 2, 25.2),
            rotationY: -27.5,
        })
        physFactory.create({
            size: Vector3.create(2.4, 4, 0.7),
            position: Vector3.create(50.3, 2, 26.5),
            rotationY: -45,
        })
        physFactory.create({
            size: Vector3.create(2.5, 4, 0.7),
            position: Vector3.create(51.65, 2, 28.3),
            rotationY: -62.5,
        })
        physFactory.create({
            size: Vector3.create(2.5, 4, 0.7),
            position: Vector3.create(52.35, 2, 30.5),
            rotationY: -81,
        })


        physFactory.create({
            size: Vector3.create(34.2, 4, 0.7),
            position: Vector3.create(28.35, 2, 39.9), //15.62
        })
        physFactory.create({
            size: Vector3.create(2, 4, 0.7),
            position: Vector3.create(46.45, 2, 39.8),
            rotationY: 9,
        })
        physFactory.create({
            size: Vector3.create(2.5, 4, 0.7),
            position: Vector3.create(48.48, 2, 39),
            rotationY: 27.5,
        })
        physFactory.create({
            size: Vector3.create(2.4, 4, 0.7),
            position: Vector3.create(50.3, 2, 37.8),
            rotationY: 45,
        })
        physFactory.create({
            size: Vector3.create(2.5, 4, 0.7),
            position: Vector3.create(51.65, 2, 35.92),
            rotationY: 62.5,
        })
        physFactory.create({
            size: Vector3.create(3.2, 4, 0.7),
            position: Vector3.create(52.35, 2, 33.3),
            rotationY: 81,
        })


        physFactory.create({
            size: Vector3.create(3.2, 4, 0.3),
            position: Vector3.create(48.35, 4, 35),
            rotationY: 14,
        })
        physFactory.create({
            size: Vector3.create(3.2, 4, 0.3),
            position: Vector3.create(48.35, 4, 29),
            rotationY: -14,
        })
        physFactory.create({
            size: Vector3.create(5.5, 4, 0.6),
            position: Vector3.create(50, 4, 32),
            rotationY: 90,
        })
    }
}
