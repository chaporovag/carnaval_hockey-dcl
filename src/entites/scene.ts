import { Animator, engine, Entity, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { PhysFactory } from '../core/physFactory'
import { Materials, physWorld } from '../core/physWorld'
import CANNON from 'cannon/build/cannon'
import * as utils from '@dcl-sdk/utils'
import resources from '../core/resources'

export class Scene {
  private readonly SCENE_POSITION = Vector3.create(32, 0, 32)

  private readonly entity: Entity = engine.addEntity()
  private readonly iceMachine: Entity = engine.addEntity()
  private readonly goalAnimation: Entity = engine.addEntity()
  private readonly tutorialAnimation: Entity = engine.addEntity()

  constructor(debug: boolean = false) {
    const world = physWorld.getWorld()
    const puckMaterial = physWorld.getMaterial(Materials.PUCK)
    const wallMaterial = physWorld.getMaterial(Materials.WALL)
    // const wallMaterial = physWorld.createMaterial(Materials.WALL)
    const wallContactMaterial = new CANNON.ContactMaterial(wallMaterial, puckMaterial, {
      friction: 0.0,
      restitution: 0.6
    })
    world.addContactMaterial(wallContactMaterial)

    GltfContainer.create(this.entity, { src: resources.MODEL_SCENE })
    Transform.create(this.entity, {
      position: this.SCENE_POSITION
    })

    /*GltfContainer.create(this.iceMachine, { src: resources.MODEL_ICE_MACHINE })
    Transform.create(this.iceMachine, {
      position: this.SCENE_POSITION
    })

    Animator.create(this.iceMachine, {
      states: [
        {
          clip: 'on',
          playing: true,
          loop: true
        }
      ]
    })*/

    GltfContainer.create(this.goalAnimation, { src: resources.MODEL_GOAL_FX })
    Transform.create(this.goalAnimation, {
      position: this.SCENE_POSITION
    })

    Animator.create(this.goalAnimation, {
      states: [
        {
          clip: 'GoalON',
          playing: false,
          loop: false
        }
      ]
    })

    this.tutorialAnimation = engine.addEntity()
    GltfContainer.create(this.tutorialAnimation, { src: resources.MODEL_TUTORIAL_FX })
    Transform.create(this.tutorialAnimation, {
      position: this.SCENE_POSITION
    })

    Animator.create(this.tutorialAnimation, {
      states: [
        {
          clip: 'on',
          playing: false,
          loop: false
        }
      ]
    })

    const physFactory = new PhysFactory(world, wallMaterial, debug)
    physFactory.create({
      size: Vector3.create(27.2, 4, 2),
      position: Vector3.create(31.6, 2, 23.5)
    })
    physFactory.create({
      size: Vector3.create(2.2, 4, 2),
      position: Vector3.create(46.3, 2, 23.7),
      rotation: -9
    })
    physFactory.create({
      size: Vector3.create(2.5, 4, 2),
      position: Vector3.create(48.48, 2, 24.3),
      rotation: -27.5
    })
    physFactory.create({
      size: Vector3.create(2.4, 4, 2),
      position: Vector3.create(50.5, 2, 25.8),
      rotation: -45
    })
    physFactory.create({
      size: Vector3.create(2.4, 4, 2),
      position: Vector3.create(52.1, 2, 27.9),
      rotation: -62.5
    })
    physFactory.create({
      size: Vector3.create(5.2, 4, 2),
      position: Vector3.create(52.8, 2, 32),
      rotation: -90
    })
    physFactory.create({
      size: Vector3.create(2.5, 4, 2),
      position: Vector3.create(52.2, 2, 36),
      rotation: 62.5
    })
    physFactory.create({
      size: Vector3.create(2.4, 4, 2),
      position: Vector3.create(50.7, 2, 38.1),
      rotation: 45
    })
    physFactory.create({
      size: Vector3.create(2.5, 4, 2),
      position: Vector3.create(48.48, 2, 39.7),
      rotation: 27.5
    })
    physFactory.create({
      size: Vector3.create(2.2, 4, 2),
      position: Vector3.create(46.3, 2, 40.3),
      rotation: 9
    })
    physFactory.create({
      size: Vector3.create(27, 4, 2),
      position: Vector3.create(31.6, 2, 40.5)
    })
    physFactory.create({
      size: Vector3.create(3.8, 4, 2),
      position: Vector3.create(16.5, 2, 39.9),
      rotation: -19
    })
    physFactory.create({
      size: Vector3.create(3, 4, 2),
      position: Vector3.create(13.4, 2, 38.1),
      rotation: -45
    })
    physFactory.create({
      size: Vector3.create(2, 4, 2),
      position: Vector3.create(11.7, 2, 35.9),
      rotation: -63
    })
    physFactory.create({
      size: Vector3.create(6, 4, 2),
      position: Vector3.create(11.2, 2, 32),
      rotation: 90
    })
    physFactory.create({
      size: Vector3.create(2, 4, 2),
      position: Vector3.create(11.7, 2, 28.2),
      rotation: 63
    })
    physFactory.create({
      size: Vector3.create(3, 4, 2),
      position: Vector3.create(13.4, 2, 26),
      rotation: 45
    })
    physFactory.create({
      size: Vector3.create(3.8, 4, 2),
      position: Vector3.create(16.5, 2, 24.1),
      rotation: 19
    })

    // gates
    physFactory.create({
      size: Vector3.create(3.2, 4, 0.6),
      position: Vector3.create(48.35, 4, 35),
      rotation: 14
    })
    physFactory.create({
      size: Vector3.create(3.2, 4, 0.6),
      position: Vector3.create(48.35, 4, 29),
      rotation: -14
    })
    physFactory.create({
      size: Vector3.create(5.5, 4, 1),
      position: Vector3.create(49.5, 4, 32),
      rotation: 90
    })

    utils.addTestCube(
      {
        position: Vector3.create(this.SCENE_POSITION.x + 1, this.SCENE_POSITION.y + 10, this.SCENE_POSITION.z),
        scale: Vector3.create(25, 20, 16.4)
      },
      undefined,
      undefined,
      { ...Color4.Red(), a: debug ? 0.75 : 0 }
    )
  }

  public playGoalAnimation(): void {
    Animator.playSingleAnimation(this.goalAnimation, 'GoalON')
  }

  public playTutorialAnimation(): void {
    Animator.playSingleAnimation(this.tutorialAnimation, 'on')
  }

  public playIceMachineAnimation(): void {
    /*timers.create(
      'iceMachine',
      () => {
        Transform.getMutable(this.iceMachine).scale = Vector3.One()
        Animator.playSingleAnimation(this.iceMachine, 'on')
      },
      { delay: 3000 }
    )*/
  }

  public stopIceMachineAnimation(): void {
    /*timers.remove('iceMachine')
    Animator.stopAllAnimations(this.iceMachine)
    Transform.getMutable(this.iceMachine).scale = Vector3.Zero()*/
  }
}
