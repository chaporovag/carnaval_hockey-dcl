import {CameraModeArea, CameraType, engine, InputAction, inputSystem, PointerEventType, Transform} from '@dcl/sdk/ecs'
import {Color3, Quaternion, Vector3} from '@dcl/sdk/math'
import * as CANNON from 'cannon/build/cannon'
import {Puck} from './puck'
import * as utils from '@dcl-sdk/utils'
import {Goaltender} from './goaltender'
import {physWorld} from './physWorld'
import {Sign} from './sign'
import {Base} from './base'
import {Defender} from './defender'
import {Sound} from './sound'
import {hideUi, setupUi} from './ui'


const isDebugging = false
export function main() {
    const startSound = new Sound('sounds/start_timer.mp3')
    const hornSound = new Sound('sounds/horn.mp3')
    const goalSound = new Sound('sounds/horn_goal.mp3')
    const whistleSound = new Sound('sounds/whistle.mp3')
    const gameSound = new Sound('sounds/game_session.mp3', true)

    utils.triggers.enableDebugDraw(isDebugging)
    physWorld.setDebugDraw(isDebugging)

    let score = 0
    let time = 0
    let startTimeout: number

    const sign = new Sign('')
    function updateGame(score: number, time: number) {
        let finishedText = ''
        if (time <= 0) finishedText = 'YOU LOSE';
        if (score >= 30) finishedText = 'YOU WON';

        if (finishedText) {
            end(finishedText)
            return
        }

        sign.setText(`${time} | ${score} / 30`);

        if (time < 45) leftDefender.start()
        if (time < 30) rightDefender.start()
    }

    const world = physWorld.world
    const goaltender = new Goaltender(isDebugging)
    const leftDefender = new Defender({
        left: Vector3.create(40, 2.28, 37),
        right:  Vector3.create(40, 2.28, 26)
    }, 2, isDebugging)
    const rightDefender = new Defender({
        left: Vector3.create(32, 2.28, 37),
        right:  Vector3.create(32, 2.28, 26)
    }, 1.6, isDebugging)

    function start() {
        hornSound.play()
        score = 0;
        time = 60;
        sign.startTimer(() => updateGame(score, --time))
        goaltender.start()
        puck.start()
    }

    function end(text: string = '') {
        utils.timers.clearTimeout(startTimeout)
        startSound.stop()
        gameSound.stop()
        whistleSound.play()
        sign.stopTimer()
        puck.stop()
        goaltender.stop();
        leftDefender.stop()
        rightDefender.stop()
        score = 0;
        time = 0;
        sign.setText(text)
        resetDisc()
        hideUi()
    }

    // Puck and setting
    const X_OFFSET = 0
    const Y_OFFSET = 0.05
    const Z_OFFSET = 2.5

    const puckParent = engine.addEntity()
    Transform.create(puckParent, { parent: engine.PlayerEntity, position: Vector3.create(0, 0, 0) })

    const puck = new Puck({
        position: Vector3.create(X_OFFSET, Y_OFFSET, Z_OFFSET),
        rotation: Quaternion.Zero(),
        scale: Vector3.Zero(),
        parent: puckParent
    })

    const base = new Base(isDebugging)

    // Config
    const SHOOT_VELOCITY = 150
    const FIXED_TIME_STEPS = 1.0 / 60.0 // seconds
    const MAX_TIME_STEPS = 3
    const RECALL_SPEED = 10

    function recallDiscSystem(dt: number) {
        if (!puck.isFired) {
            let transform = Transform.getMutable(puck.entity)
            const player = Transform.get(engine.CameraEntity)
            let playerForwardVector = Vector3.subtract(
                transform.position,
                Vector3.create(player.position.x, physWorld.groundPositionY + Y_OFFSET, player.position.z)
            )
            let increment = Vector3.scale(playerForwardVector, -dt * RECALL_SPEED)
            transform.position = Vector3.add(Transform.getMutable(puck.entity).position, increment)
            let distance = Vector3.distanceSquared(transform.position, player.position) // Check distance squared as it's more optimized
            // Note: Distance is squared so a value of 4.5 is when the puck is ~2.1m away
            if (distance <= 9) {
                engine.removeSystem(recallDiscSystem)
                resetDisc()
            }
        }
    }

    // Input system
    engine.addSystem(() => {
        // Shoot / recall puck disc
        const pointerDown = inputSystem.getInputCommand(InputAction.IA_POINTER, PointerEventType.PET_DOWN)

        if (pointerDown && puck.isStarted) {
            // utils.timers.clearInterval(timerId)
            // console.log('SHOOT_STRENGTH', SHOOT_STRENGTH)
            if (!puck.isFired) {
                // engine.addSystem(shootDiscSystem)
                utils.playSound('sounds/slap_shot.mp3')

                puck.setFired(true)
                Transform.getMutable(puck.entity).parent = engine.RootEntity

                let cameraTransform = Transform.get(engine.CameraEntity)
                let shootDirection = Vector3.rotate(Vector3.Forward(), cameraTransform.rotation) //Vector3.Forward().rotate(Camera.instance.rotation) // Camera's forward vector
                puck.body.position.set(
                    cameraTransform.position.x + shootDirection.x,
                    physWorld.groundPositionY + 0.2,
                    cameraTransform.position.z + shootDirection.z
                )

                // Shoot
                puck.body.applyImpulse(
                    new CANNON.Vec3(
                        shootDirection.x * SHOOT_VELOCITY,
                        0,
                        shootDirection.z * SHOOT_VELOCITY
                    ),
                    puck.body.position
                )
            } else {
                // Recall
                console.log('adding recall')
                engine.addSystem(recallDiscSystem)
                puck.setFired(false)
            }
        }
    })

    function resetDisc(): void {
        puck.body.velocity.setZero()
        puck.body.angularVelocity.setZero()
        let transform = Transform.getMutable(puck.entity)
        transform.parent = puckParent
        transform.position = Vector3.create(X_OFFSET, Y_OFFSET, Z_OFFSET)
    }

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
            startSound.play()
            gameSound.play()
            setupUi()
            startTimeout = utils.timers.setTimeout(() => start(), 9500)
        },
        () => end(),
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
            if (puck.isFired && time > 0) {
                goalSound.play()
                updateGame(++score, time)
            }
        },
        undefined,
        Color3.Red()
    )

    // Game system
    engine.addSystem((dt) => {
        world.step(FIXED_TIME_STEPS, dt, MAX_TIME_STEPS)
        goaltender.update()
        leftDefender.update()
        rightDefender.update()
        puck.update()
    })
    /*function shootDiscSystem(dt: number) {
        if (puck.isFired) {
            // world.step(FIXED_TIME_STEPS, dt, MAX_TIME_STEPS)
            let transform = Transform.getMutable(puck.entity)
            transform.position = puckBody.position
        } else {
            engine.removeSystem(shootDiscSystem)
        }
    }*/


    // don't show the puck outside the scene
    // engine.addSystem(onlyInSceneSystem)

    // UI

}
