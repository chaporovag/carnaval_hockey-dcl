import {engine, Entity, GltfContainer, Transform} from '@dcl/sdk/ecs'
import {Color4, Quaternion, Vector3} from '@dcl/sdk/math'
import CANNON from 'cannon/build/cannon'
import {Materials, physWorld} from './physWorld'
import * as utils from '@dcl-sdk/utils'
import {InterpolationType} from '@dcl/asset-packs'

interface IPosition {
    left: Vector3
    right: Vector3
}

export class Defender {
    private readonly entity: Entity = engine.addEntity()
    private readonly player: Entity = engine.addEntity()
    private readonly debugEntity: Entity | null = null
    private readonly body: CANNON.Body

    private isReadyToPlay = false
    private interpolationType = InterpolationType.EASEOUTEBOUNCE

    private position: IPosition
    private direction = 1
    private speed: number

    constructor(pos: IPosition, speed: number, debug: boolean = false) {
        this.position = pos
        this.speed = speed

        Transform.create(this.entity, {
            position: this.position.left,
        })

        this.player = engine.addEntity()
        Transform.create(this.player, {
            parent: this.entity,
            scale: Vector3.Zero()
        })
        GltfContainer.create(this.player, {
            src: 'models/Player_2_V2.glb'
        })

        const size = Vector3.create(1, 6, 3.1)
        const position = Transform.getMutable(this.entity).position

        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2))
        const body = new CANNON.Body({
            mass: 0,
            shape,
            position: new CANNON.Vec3(position.x, position.y + 100, position.z),
        })

        body.addShape(shape)
        body.material = physWorld.getMaterial(Materials.GROUND)
        physWorld.world.addBody(body)

        if (debug) {
            this.debugEntity = utils.addTestCube({
                position: body.position,
                scale: size,
                rotation: body.quaternion
            }, undefined, undefined, {...Color4.Green(), a: 0.75}, false, true)
        }

        this.body = body
    }

    public update(): void {
        if (this.isReadyToPlay) {
            const position = Transform.get(this.entity).position
            this.body.position.set(position.x, position.y, position.z)
            if (this.debugEntity) {
                Transform.getMutable(this.debugEntity).position = position
            }
        }
    }

    public start(): void {
        if (!this.isReadyToPlay) {
            const position = Transform.get(this.entity).position
            this.body.position.set(position.x, position.y, position.z)
            Transform.getMutable(this.player).scale = Vector3.One()
            utils.tweens.startRotation(
                this.player,
                Quaternion.fromAngleAxis(90, Vector3.create(0,0,1)),
                Quaternion.fromAngleAxis(1, Vector3.create(0,0,1)),
                0.95,
                this.interpolationType,
                () => {
                    this.isReadyToPlay = true
                    this.move()
                }
            );
        }
    }

    public stop(): void {
        this.isReadyToPlay = false
        utils.tweens.stopTranslation(this.entity)
        utils.tweens.startRotation(
            this.player,
            Quaternion.fromAngleAxis(0, Vector3.create(0,0,1)),
            Quaternion.fromAngleAxis(90, Vector3.create(0,0,1)),
            1,
            this.interpolationType,
            () => this.reset()
        );
    }

    private reset(): void {
        const basePosition = this.position.left
        const { x, y, z } = basePosition
        Transform.getMutable(this.entity).position = basePosition
        /*utils.tweens.startTranslation(
            this.entity,
            Transform.get(this.entity).position,
            basePosition,
            0,
            InterpolationType.LINEAR,
            () => Transform.getMutable(this.entity).position = basePosition
        )*/
        const mutable = Transform.getMutable(this.player)
        mutable.scale = Vector3.Zero()
        mutable.rotation = Quaternion.fromAngleAxis(90, Vector3.create(0,0,1))

        this.body.position.set(x, y + 100, z)
        if (this.debugEntity) {
            Transform.getMutable(this.debugEntity).position = basePosition
        }
        this.direction = 1
    }

    private move(): void {
        if (this.isReadyToPlay) {
            const position = Transform.get(this.entity).position
            utils.tweens.startTranslation(
                this.entity,
                position,
                this.direction === 1 ? this.position.right : this.position.left,
                this.speed,
                InterpolationType.LINEAR,
                () => {
                    if (this.isReadyToPlay) {
                        const degrees = this.direction > 0 ? 180 : 0
                        utils.tweens.startRotation(
                            this.player,
                            Quaternion.fromAngleAxis(degrees === 180 ? 0 : 180, Vector3.create(0,1,0)),
                            Quaternion.fromAngleAxis(degrees, Vector3.create(0,1,0)),
                            0.2,
                            InterpolationType.LINEAR
                        );
                        this.direction *= -1
                        this.move()
                    }
                }
            );
        }
    }
}
