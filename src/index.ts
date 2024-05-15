import {
    CameraModeArea,
    CameraType,
    engine,
    GltfContainer,
    InputAction,
    inputSystem,
    MeshRenderer,
    PointerEventType,
    Transform
} from '@dcl/sdk/ecs'
import {Color3, Color4, Quaternion, Vector3} from '@dcl/sdk/math'
import * as CANNON from 'cannon/build/cannon'
import {Puck} from './puck'
import * as utils from '@dcl-sdk/utils'
import {PhysFactory} from './physFactory'
import {ScoreObject} from './score'

export function main() {
    const isDebugging = false

    // Remove default trigger from a player so that they don't interfere
    utils.triggers.removeTrigger(engine.PlayerEntity)
    utils.triggers.enableDebugDraw(isDebugging)

    const ground_position_y = 2.3

    // Puck and setting
    const X_OFFSET = 0
    const Y_OFFSET = 0.05
    const Z_OFFSET = 2.5

    const puckParent = engine.addEntity()
    Transform.create(puckParent, { parent: engine.PlayerEntity, position: Vector3.create(0, 0, 0) })

    const puck = new Puck({
        position: Vector3.create(X_OFFSET, Y_OFFSET, Z_OFFSET),
        rotation: Quaternion.Zero(),
        scale: Vector3.One(),
        parent: puckParent
    })
    utils.triggers.addTrigger(puck.entity, utils.LAYER_1, utils.NO_LAYERS, [{type: 'sphere', radius: 0.5}]);

    // Setup our CANNON world
    const world = new CANNON.World()
    world.quatNormalizeSkip = 0
    world.quatNormalizeFast = false
    world.gravity.set(0, -9.82, 0) // m/s²

    const groundMaterial = new CANNON.Material('groundMaterial')
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
            ground_position_y,
            0
        ), // m
    })
    groundBody.addShape(groundShape)
    groundBody.material = groundMaterial
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis
    world.addBody(groundBody)

    // Debug ground shape
    if (isDebugging) {
        const myPlane = engine.addEntity()

        Transform.create(myPlane, {
            position: groundBody.position,
            rotation: groundBody.quaternion,
            scale: Vector3.scale(Vector3.One(), 10)
        })

        MeshRenderer.setPlane(myPlane)
    }

    // Create puck physics
    let puckTransform = Transform.getMutable(puck.entity)

    const puckBody: CANNON.Body = new CANNON.Body({
        mass: 3, // kg
        position: new CANNON.Vec3(
            puckTransform.position.x,
            puckTransform.position.y,
            puckTransform.position.z
        ), // m
        shape: new CANNON.Cylinder(0.2, 0.2, 0.15, 4) // m (Create sphere shaped body with a radius of 0.2)
    })

    const puckPhysicsMaterial: CANNON.Material = new CANNON.Material('puckMaterial')
    const puckPhysicsContactMaterial = new CANNON.ContactMaterial(groundMaterial, puckPhysicsMaterial, {
        friction: 0.0,
        restitution: 0.0
    })
    world.addContactMaterial(puckPhysicsContactMaterial)

    puckBody.material = puckPhysicsMaterial // Add bouncy material to puck body
    puckBody.linearDamping = 0.4 // Round bodies will keep translating even with friction so you need linearDamping
    puckBody.angularDamping = 0.4 // Round bodies will keep rotating even with friction so you need angularDamping

    world.addBody(puckBody) // Add body to the world

    // Invisible walls
    const wallMaterial = new CANNON.Material('wallMaterial')
    const wallContactMaterial = new CANNON.ContactMaterial(wallMaterial, puckPhysicsMaterial, {
        friction: 0.0,
        restitution: 0.6
    })
    world.addContactMaterial(wallContactMaterial)
/*

    const wallSize = Vector3.create(32, 10, 1)
    const wallDelta = wallSize.z / 2
    const wallShape = new CANNON.Box(new CANNON.Vec3(wallSize.x / 2, wallSize.y / 2, wallSize.z / 2))

    //#region
    const wallNorth = new CANNON.Body({
        mass: 0,
        shape: wallShape,
        position: new CANNON.Vec3(16, wallSize.y / 2 - 1, 32 - wallDelta),
    })
    wallNorth.material = wallMaterial
    world.addBody(wallNorth)
    utils.addTestCube({position: wallNorth.position, scale: wallSize }, undefined, undefined, { ...Color4.Gray(), a: 0.5}, false, true)

    const wallSouth = new CANNON.Body({
        mass: 0,
        shape: wallShape,
        position: new CANNON.Vec3(16, wallSize.y / 2 - 1, wallDelta),
    })
    wallSouth.material = wallMaterial
    world.addBody(wallSouth)
    utils.addTestCube({position: wallSouth.position, scale: wallSize }, undefined, undefined, { ...Color4.Gray(), a: 0.5}, false, true)

    const wallEast = new CANNON.Body({
        mass: 0,
        shape: wallShape,
        position: new CANNON.Vec3(32 - wallDelta, wallSize.y /2 - 1 , 16),
    })
    wallEast.material = wallMaterial
    wallEast.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
    world.addBody(wallEast)
    utils.addTestCube({position: wallEast.position, scale: wallSize, rotation: wallEast.quaternion }, undefined, undefined, { ...Color4.Gray(), a: 0.5}, false, true)

    const wallWest = new CANNON.Body({
        mass: 0,
        shape: wallShape,
        position: new CANNON.Vec3(wallDelta, wallSize.y/2 - 1, 16),
    })
    wallWest.material = wallMaterial
    wallWest.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
    world.addBody(wallWest)
    utils.addTestCube({position: wallWest.position, scale: wallSize, rotation: wallWest.quaternion }, undefined, undefined, { ...Color4.Gray(), a: 0.5}, false, true)
    //#endregion
*/

    // Config
    const SHOOT_VELOCITY = 150
    const FIXED_TIME_STEPS = 1.0 / 60.0 // seconds
    const MAX_TIME_STEPS = 3
    const RECALL_SPEED = 10

    function shootDiscSystem(dt: number) {
        if (puck.isFired) {
            world.step(FIXED_TIME_STEPS, dt, MAX_TIME_STEPS)
            let transform = Transform.getMutable(puck.entity)
            transform.position = puckBody.position
        } else {
            engine.removeSystem(shootDiscSystem)
        }
    }

    function recallDiscSystem(dt: number) {
        if (!puck.isFired) {
            let transform = Transform.getMutable(puck.entity)
            const player = Transform.get(engine.CameraEntity)
            let playerForwardVector = Vector3.subtract(
                transform.position,
                Vector3.create(player.position.x, ground_position_y + Y_OFFSET, player.position.z)
            )
            let increment = Vector3.scale(playerForwardVector, -dt * RECALL_SPEED)
            transform.position = Vector3.add(puckTransform.position, increment)
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

        if (pointerDown && puck) {
            // utils.timers.clearInterval(timerId)
            // console.log('SHOOT_STRENGTH', SHOOT_STRENGTH)
            if (!puck.isFired) {
                engine.addSystem(shootDiscSystem)
                puck.setFired(true)
                Transform.getMutable(puck.entity).parent = engine.RootEntity

                let cameraTransform = Transform.get(engine.CameraEntity)
                let shootDirection = Vector3.rotate(Vector3.Forward(), cameraTransform.rotation) //Vector3.Forward().rotate(Camera.instance.rotation) // Camera's forward vector
                puckBody.position.set(
                    cameraTransform.position.x + shootDirection.x,
                    ground_position_y + 0.2,
                    cameraTransform.position.z + shootDirection.z
                )

                // Shoot
                puckBody.applyImpulse(
                    new CANNON.Vec3(
                        shootDirection.x * SHOOT_VELOCITY,
                        0,
                        shootDirection.z * SHOOT_VELOCITY
                    ),
                    new CANNON.Vec3(puckBody.position.x, puckBody.position.y, puckBody.position.z)
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
        puckBody.velocity.setZero()
        puckBody.angularVelocity.setZero()
        let transform = Transform.getMutable(puck.entity)
        transform.parent = puckParent
        transform.position = Vector3.create(X_OFFSET, Y_OFFSET, Z_OFFSET)
    }

    // Create ThirdViewArea
    const thirdViewAreaSize = Vector3.create(40, 3, 18)
    const thirdViewArea = utils.addTestCube({position: Vector3.create(32, 3, 32), scale: thirdViewAreaSize }, undefined, undefined,  { ...Color4.Blue(), a: isDebugging ? 0.5 : 0.0 }, false, true)
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
            if (puck.isFired) {
                let transform = Transform.getMutable(goalTriggerZone)
                ScoreObject.Create({
                    type: [ScoreObject.SCORE_TYPE.TEN, ScoreObject.SCORE_TYPE.TWENTYFIVE, ScoreObject.SCORE_TYPE.FIFTY][Math.floor(Math.random() * 3)],
                    pos:  {...transform.position, y: 7 }
                })
            }
        },
        undefined,
        Color3.Red()
    )

    // Create base scene
    const base = engine.addEntity()
    GltfContainer.create(base, {
        src: 'models/Test_Game_V1.glb'
    })
    Transform.create(base, { position: Vector3.create(32, 0, 32), scale: Vector3.scale(Vector3.One(), 0.7)})

    const physFactory = new PhysFactory(world, wallMaterial, isDebugging)
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

    const player = engine.addEntity()
    Transform.create(player, {
        position: Vector3.create(44, 3.5, 32),
        rotation: Quaternion.Zero(),
        scale: Vector3.scale(Vector3.One(), 0.5),
    })
    GltfContainer.create(player, {
        src: 'models/Player_Game_V1.glb'
    })
    physFactory.create({
        size: Vector3.create(1, 4, 2.5),
        position: Transform.getMutable(player).position,
    })


    // don't show the puck outside the scene
    // engine.addSystem(onlyInSceneSystem)

    // UI
    // setupUi()
}
