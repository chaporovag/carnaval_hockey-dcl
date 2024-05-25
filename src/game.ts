import {Sound} from './sound'
import * as utils from '@dcl-sdk/utils'
import {Sign} from './sign'
import {physWorld} from './physWorld'
import {Goaltender} from './goaltender'
import {Defender} from './defender'
import {Color3, Quaternion, Vector3} from '@dcl/sdk/math'
import {
    CameraModeArea,
    CameraType,
    engine,
    Entity,
    InputAction,
    inputSystem,
    PointerEventType,
    Transform
} from '@dcl/sdk/ecs'
import {Puck} from './puck'
import {Base} from './base'
import CANNON from 'cannon/build/cannon'

export class Game {
    // Config
    private readonly X_OFFSET = 0
    private readonly Y_OFFSET = 0.05
    private readonly Z_OFFSET = 2.5

    // Physics
    private world: CANNON.World
    private readonly SHOOT_VELOCITY = 150
    private readonly FIXED_TIME_STEPS = 1.0 / 60.0 // seconds
    private readonly MAX_TIME_STEPS = 3
    private readonly RECALL_SPEED = 10

    // Variables
    private readonly isDebug
    private score = 0
    private time = 0
    private startTimeout = -1
    private isRecalling = false

    // Entities
    private sign: Sign | undefined
    private puck: Puck | undefined
    private puckParent: Entity | undefined
    private goaltender: Goaltender | undefined
    private leftDefender: Defender | undefined
    private rightDefender: Defender | undefined

    // Sounds
    private startSound: Sound | undefined
    private hornSound: Sound | undefined
    private goalSound: Sound | undefined
    private whistleSound: Sound | undefined
    private gameSound: Sound | undefined

    constructor(debug: boolean = false) {
        this.isDebug = debug
        utils.triggers.enableDebugDraw(this.isDebug)

        this.world = physWorld.world
        this.setupGameObjects()
        this.setupTriggers()
        this.setupSounds()
        this.setupSystems()
    }

    private setupGameObjects(): void {
        this.sign = new Sign('')

        this.goaltender = new Goaltender(this.isDebug)

        this.leftDefender = new Defender({
            left: Vector3.create(40, 2.28, 37),
            right:  Vector3.create(40, 2.28, 26)
        }, 2, this.isDebug)

        this.rightDefender = new Defender({
            left: Vector3.create(32, 2.28, 37),
            right:  Vector3.create(32, 2.28, 26)
        }, 1.6, this.isDebug)

        const puckParent = engine.addEntity()
        Transform.create(puckParent, { parent: engine.PlayerEntity, position: Vector3.create(0, 0, 0) })

        this.puck = new Puck({
            position: Vector3.create(this.X_OFFSET, this.Y_OFFSET, this.Z_OFFSET),
            rotation: Quaternion.Zero(),
            scale: Vector3.Zero(),
            parent: puckParent
        })

        new Base(this.isDebug)
    }

    private setupTriggers(): void {
        // Create ThirdViewArea
        const thirdViewAreaSize = Vector3.create(40, 3, 18)
        const thirdViewArea = engine.addEntity()
        Transform.create(thirdViewArea, {
            position: Vector3.create(32, 3, 32)
        })

        utils.triggers.addTrigger(
            thirdViewArea,
            utils.NO_LAYERS,
            utils.LAYER_1,
            [{ type: 'box', scale: thirdViewAreaSize }],
            () => {
                // Play sound
                this.startSound?.play()
                this.gameSound?.play()
                this.startTimeout = utils.timers.setTimeout(() => this.start(), 9500)
            },
            () => this.end(),
            Color3.Black()
        )


        // const thirdViewArea = utils.addTestCube({position: Vector3.create(32, 3, 32), scale: thirdViewAreaSize }, undefined, undefined,  { ...Color4.Blue(), a: isDebugging ? 0.5 : 0.0 }, false, true)
        CameraModeArea.create(thirdViewArea, {
            area: thirdViewAreaSize,
            mode: CameraType.CT_FIRST_PERSON,
        })

        // Create GoalTriggerZone
        const goalTriggerZone = engine.addEntity()
        Transform.create(goalTriggerZone, {
            position: Vector3.create(48, 4, 32)
        })
        utils.triggers.addTrigger(goalTriggerZone, utils.NO_LAYERS, utils.ALL_LAYERS, [{ type: 'box', scale: Vector3.create(3,4,5) }],
            () => {
                if (this.puck?.isFired && this.time > 0) {
                    this.goalSound?.play()
                    this.update(++this.score, this.time)
                }
            },
            undefined,
            Color3.Red()
        )
    }

    private setupSystems(): void {
        engine.addSystem(() => {
            // Shoot / recall puck disc
            const pointerDown = inputSystem.getInputCommand(InputAction.IA_POINTER, PointerEventType.PET_DOWN)

            if (pointerDown && this.puck?.isStarted) {
                // utils.timers.clearInterval(timerId)
                // console.log('SHOOT_STRENGTH', SHOOT_STRENGTH)
                if (!this.puck?.isFired) {
                    // engine.addSystem(shootDiscSystem)
                    utils.playSound('sounds/slap_shot.mp3')

                    this.puck?.setFired(true)
                    Transform.getMutable(this.puck?.entity).parent = engine.RootEntity

                    let cameraTransform = Transform.get(engine.CameraEntity)
                    let shootDirection = Vector3.rotate(Vector3.Forward(), cameraTransform.rotation) //Vector3.Forward().rotate(Camera.instance.rotation) // Camera's forward vector
                    this.puck?.body.position.set(
                        cameraTransform.position.x + shootDirection.x,
                        physWorld.groundPositionY + 0.2,
                        cameraTransform.position.z + shootDirection.z
                    )

                    // Shoot
                    this.puck?.body.applyImpulse(
                        new CANNON.Vec3(
                            shootDirection.x * this.SHOOT_VELOCITY,
                            0,
                            shootDirection.z * this.SHOOT_VELOCITY
                        ),
                        this.puck?.body.position
                    )
                } else {
                    // Recall
                    console.log('adding recall', this.puck, this.puck.entity)
                    // this.isRecalling = true
                    // this.puck?.setFired(false)
                    this.resetDisc()
                    this.puck?.setFired(false)
                }
            }
        })

        // Game system
        engine.addSystem((dt) => {
            this.world.step(this.FIXED_TIME_STEPS, dt, this.MAX_TIME_STEPS)
            this.goaltender?.update()
            this.leftDefender?.update()
            this.rightDefender?.update()
            this.puck?.update()
        })

        // engine.addSystem((dt) => this.recallDiscSystem(dt))
    }

    private setupSounds(): void {
        this.startSound = new Sound('sounds/start_timer.mp3')
        this.hornSound = new Sound('sounds/horn.mp3')
        this.goalSound = new Sound('sounds/horn_goal.mp3')
        this.whistleSound = new Sound('sounds/whistle.mp3')
        this.gameSound = new Sound('sounds/game_session.mp3', true)
    }

    private update(score: number, time: number) {
        let finishedText = ''
        if (time <= 0) finishedText = 'YOU LOSE';
        if (score >= 30) finishedText = 'YOU WON';

        if (finishedText) {
            this.end(finishedText)
            return
        }

        this.sign?.setText(`${time} | ${score} / 30`);

        if (time < 45) {
            this.leftDefender?.start()
        }
        if (time < 30) {
            this.rightDefender?.start()
        }
    }

    private start() {
        this.hornSound?.play()
        this.score = 0;
        this.time = 60;
        this.sign?.startTimer(() => this.update(this.score, --this.time))
        this.goaltender?.start()
        this.puck?.start()
    }

    private end(text: string = '') {
        utils.timers.clearTimeout(this.startTimeout)
        this.startSound?.stop()
        this.gameSound?.stop()
        this.whistleSound?.play()
        this.sign?.stopTimer()
        this.puck?.stop()
        this.goaltender?.stop();
        this.leftDefender?.stop()
        this.rightDefender?.stop()
        this.sign?.setText(text)
        this.score = 0;
        this.time = 0;
        this.resetDisc()
    }

    private recallDiscSystem(dt: number) {
        if (this.isRecalling && !this.puck?.isFired) {
            console.log('HERE')
            let transform = Transform.getMutable(this.puck?.entity as Entity)
            const player = Transform.get(engine.CameraEntity)
            let playerForwardVector = Vector3.subtract(
                transform.position,
                Vector3.create(player.position.x, physWorld.groundPositionY + this.Y_OFFSET, player.position.z)
            )
            let increment = Vector3.scale(playerForwardVector, -dt * this.RECALL_SPEED)
            transform.position = Vector3.add(Transform.getMutable(this.puck?.entity as Entity).position, increment)
            let distance = Vector3.distanceSquared(transform.position, player.position) // Check distance squared as it's more optimized
            // Note: Distance is squared so a value of 4.5 is when the puck is ~2.1m away
            if (distance <= 9) {
                this.isRecalling = false
                // engine.removeSystem(this.recallDiscSystem)
                this.resetDisc()
            }
        }
    }

    private resetDisc(): void {
        this.puck?.body.velocity.setZero()
        this.puck?.body.angularVelocity.setZero()
        let transform = Transform.getMutable(this.puck?.entity as Entity)
        transform.parent = this.puckParent
        transform.position = Vector3.create(this.X_OFFSET, this.Y_OFFSET, this.Z_OFFSET)
    }
}
