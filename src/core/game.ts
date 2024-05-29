import {
  CameraModeArea,
  CameraType,
  engine,
  Entity,
  GltfContainer,
  InputAction,
  inputSystem,
  PointerEventType,
  Transform
} from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'
import CANNON from 'cannon/build/cannon'
import { Color3, Vector3 } from '@dcl/sdk/math'
import { physWorld } from './physWorld'
import resources from './resources'
import { Goalkeeper, Goaltender, Puck, Scene, Scoreboard } from '../entites'
import { Sound } from './sound'
import { setupUi } from '../ui'
import { timers } from './timers'
import { pool } from '../entites/pool'

export class Game {
  // Game
  private readonly GOAL_TARGET = 15
  private readonly SHOOT_VELOCITY = 150
  private readonly RECALL_SPEED = 500

  // Config
  private readonly X_OFFSET = 0
  private readonly Y_OFFSET = 0.05
  private readonly Z_OFFSET = 2.5

  // Variables
  private readonly isDebug
  private score = 0
  private time = 0
  private isRecalling = false
  private isGameStarted = false

  // Entities
  private scene: Scene | undefined
  private sign: Scoreboard | undefined
  // private puck: Puck | undefined
  private puckParent: Entity | undefined
  private goalkeeper: Goalkeeper | undefined
  private farTender: Goaltender | undefined
  private nearTender: Goaltender | undefined

  // Sounds
  private startSound: Sound | undefined
  private hornSound: Sound | undefined
  private goalSound: Sound | undefined
  private whistleSound: Sound | undefined
  private gameSound: Sound | undefined

  constructor(debug: boolean = false) {
    this.isDebug = debug
    utils.triggers.enableDebugDraw(this.isDebug)
    physWorld.setDebugDraw(this.isDebug)
  }

  public init() {
    setupUi()
    this.setupGameObjects()
    this.setupTriggers()
    this.setupSounds()
    this.setupSystems()
  }

  private setupGameObjects(): void {
    this.sign = new Scoreboard()

    this.goalkeeper = new Goalkeeper(this.isDebug)

    this.farTender = new Goaltender(
      {
        left: Vector3.create(40, 2.28, 37),
        right: Vector3.create(40, 2.28, 26)
      },
      2,
      this.isDebug
    )

    this.nearTender = new Goaltender(
      {
        left: Vector3.create(32, 2.28, 37),
        right: Vector3.create(32, 2.28, 26)
      },
      1.6,
      this.isDebug
    )

    this.puckParent = engine.addEntity()
    Transform.create(this.puckParent, {
      parent: engine.PlayerEntity,
      position: Vector3.create(0, 0.05, 2.5),
      scale: Vector3.Zero()
    })
    GltfContainer.create(this.puckParent, {
      src: resources.MODEL_PUCK
    })

    this.scene = new Scene(this.isDebug)
  }

  private setupTriggers(): void {
    this.createGameTriggerZone()
    this.createGoalTriggerZone()
  }

  private createGameTriggerZone(): void {
    const thirdViewAreaSize = Vector3.create(8, 3, 15)
    const thirdViewArea = engine.addEntity()
    Transform.create(thirdViewArea, {
      position: Vector3.create(16, 5, 32)
    })

    utils.triggers.addTrigger(
      thirdViewArea,
      utils.NO_LAYERS,
      utils.LAYER_1,
      [{ type: 'box', scale: thirdViewAreaSize }],
      () => {
        this.scene?.playTutorialAnimation()
        this.startSound?.play()
        this.gameSound?.play()
        timers.create('startTimer', () => this.updateStartTimer(), { delay: 3100, immediately: true, maxCount: 4 })
        // this.start()
      },
      () => this.end(),
      Color3.Yellow()
    )

    CameraModeArea.create(thirdViewArea, {
      area: thirdViewAreaSize,
      mode: CameraType.CT_FIRST_PERSON
    })
  }

  private updateStartTimer(): void {
    /*if (!this.isGameStarted) this.start()
    return*/

    const timer = timers.get('startTimer')
    switch (timer?.count) {
      case 1:
        this.sign?.setText('Score at least', 10)
        break
      case 2:
        this.sign?.setText(`${this.GOAL_TARGET} goals`)
        break
      case 3:
        this.sign?.setText('in 1 minute')
        break
      case 4:
        this.sign?.setText('GOOOO!!!')
        timers.remove('startTimer')
        this.start()
        break
    }
  }

  private createGoalTriggerZone(): void {
    const goalTriggerZone = engine.addEntity()
    Transform.create(goalTriggerZone, { position: Vector3.create(48, 4, 32) })
    utils.triggers.addTrigger(
      goalTriggerZone,
      utils.NO_LAYERS,
      utils.ALL_LAYERS,
      [{ type: 'box', scale: Vector3.create(3, 4, 5) }],
      (entity: Entity) => {
        const puck = pool.getBy(entity) as Puck
        if (puck.isFired && this.time > 0) {
          puck.setFired(false)
          this.goalSound?.play()
          this.scene?.playGoalAnimation()
          this.update(++this.score, this.time)
        }
      },
      undefined,
      Color3.Red()
    )
  }

  private setupSounds(): void {
    this.startSound = new Sound(resources.SOUND_START)
    this.hornSound = new Sound(resources.SOUND_HORN)
    this.goalSound = new Sound(resources.SOUND_GOAL)
    this.whistleSound = new Sound(resources.SOUND_WHISTLE)
    this.gameSound = new Sound(resources.SOUND_GAME, true)
  }

  private setupSystems(): void {
    engine.addSystem(() => this.gameSystem(), 1, 'gameSystem')
    // engine.addSystem((dt) => this.recallSystem(dt), 2, 'recallSystem')
    engine.addSystem((dt) => this.updateSystem(dt), 3, 'updateSystem')
  }

  private gameSystem(): void {
    const pointerDown = inputSystem.getInputCommand(InputAction.IA_POINTER, PointerEventType.PET_DOWN)

    if (pointerDown && this.isGameStarted && !this.isRecalling) {
      const puck = pool.get()
      const { /*isStarted, isFired,*/ body, entity } = puck
      // if (!isStarted) return

      // if (!isFired) {
      utils.playSound(resources.SOUND_SLAP)

      puck.setFired(true)
      // Transform.getMutable(entity).parent = engine.RootEntity

      const cameraTransform = Transform.get(engine.CameraEntity)
      const shootDirection = Vector3.rotate(Vector3.Forward(), cameraTransform.rotation)
      body.position.set(
        cameraTransform.position.x + shootDirection.x,
        physWorld.getWorldPosition().y + 0.4,
        cameraTransform.position.z + shootDirection.z
      )

      // Shoot
      body.applyImpulse(
        new CANNON.Vec3(
          shootDirection.x * this.SHOOT_VELOCITY,
          shootDirection.x * Math.random() * 10,
          shootDirection.z * this.SHOOT_VELOCITY
        ),
        body.position
      )

      if (this.puckParent) {
        // Reset puck
        this.isRecalling = true
        Transform.getMutable(this.puckParent).scale = Vector3.Zero()
        timers.create(
          'recallTimer',
          () => {
            this.puckParent && (Transform.getMutable(this.puckParent).scale = Vector3.One())
            this.isRecalling = false
          },
          { delay: this.RECALL_SPEED, maxCount: 1 }
        )

        // const pos = Transform.getMutable(engine.PlayerEntity).position
        // Transform.getMutable(engine.PlayerEntity).scale = Vector3.One()

        /*
        utils.timers.setTimeout(() => {
          Transform.getMutable(this.puckParent as Entity).scale = Vector3.One()
          this.isRecalling = false
        }, 500)*/
      }
      /*} else {
        // Recall
        this.isRecalling = true
        puck.setFired(false)
        puck.deactivate()
      }*/
    }
  }
  /*
  private recallSystem(dt: number): void {
    if (this.isRecalling && this.puck) {
      const { isFired, body, entity } = this.puck
      if (isFired) return

      let transform = Transform.getMutable(entity)
      const { position } = Transform.get(engine.CameraEntity)
      let playerForwardVector = Vector3.subtract(
        transform.position,
        Vector3.create(position.x, physWorld.getWorldPosition().y + this.Y_OFFSET, position.z)
      )

      const increment = Vector3.scale(playerForwardVector, -dt * this.RECALL_SPEED)
      transform.position = Vector3.add(Transform.getMutable(entity).position, increment)

      const distance = Vector3.distanceSquared(transform.position, position)
      if (distance <= 9) {
        this.isRecalling = false
        this.resetDisc()
      }
    }
  }*/

  private updateSystem(dt: number): void {
    if (this.isGameStarted) {
      physWorld.update(dt)
      this.goalkeeper?.update()
      this.farTender?.update()
      this.nearTender?.update()
      // this.puck?.update()
      pool.update()
    }
  }

  private update(score: number, time: number) {
    if (time <= 0) {
      const finishedText = score >= this.GOAL_TARGET ? 'WINNER!' : 'TRY AGAIN'
      this.end(finishedText)
      return
    }

    if (time < 45) {
      this.farTender?.start()
    }
    if (time < 30) {
      this.nearTender?.start()
    }

    this.sign?.setScoreTime(time, score, this.GOAL_TARGET)
  }

  private start() {
    this.score = 0
    this.time = 60
    this.hornSound?.play()
    timers.create('updateTimer', () => this.update(this.score, --this.time), { delay: 1000 })
    this.goalkeeper?.start()
    // this.puck?.start()
    this.puckParent && (Transform.getMutable(this.puckParent).scale = Vector3.One())
    this.isGameStarted = true
  }

  private end(text: string = '') {
    timers.remove('startTimer')
    timers.remove('updateTimer')
    timers.remove('recallTimer')

    if (this.isGameStarted) {
      this.whistleSound?.play()
    }
    this.startSound?.stop()
    this.gameSound?.stop()

    this.goalkeeper?.stop()
    this.farTender?.stop()
    this.nearTender?.stop()
    this.sign?.setText(text)
    this.score = 0
    this.time = 0
    this.isGameStarted = false
    pool.clear()

    this.resetDisc()
  }

  private resetDisc(): void {
    /*if (this.puck) {
      const { body, entity } = this.puck
      body.velocity.setZero()
      body.angularVelocity.setZero()
      let transform = Transform.getMutable(entity)
      transform.parent = this.puckParent
      transform.position = Vector3.create(this.X_OFFSET, this.Y_OFFSET, this.Z_OFFSET)
    }*/
    this.puckParent && (Transform.getMutable(this.puckParent).scale = Vector3.Zero())
    this.isRecalling = false
  }
}
