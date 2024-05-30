import {
  AvatarModifierArea,
  AvatarModifierType,
  CameraModeArea,
  CameraType,
  engine,
  Entity,
  GltfContainer,
  InputAction,
  inputSystem,
  PointerEventType,
  Transform
} from '@dcl/sdk/ecs';
import { ALL_LAYERS, LAYER_1, NO_LAYERS, triggers } from '@dcl-sdk/utils';
import CANNON from 'cannon/build/cannon';
import { Color3, Vector3 } from '@dcl/sdk/math';
import { physWorld } from './physWorld';
import resources from './resources';
import { Goalkeeper, Goaltender, Pool, Puck, Scene, Scoreboard } from '../entites';
import { Sound } from './sound';
import { timers } from './timers';

export class Game {
  // Config
  private readonly GOAL_TARGET = 30;
  private readonly SHOOT_VELOCITY = 150;
  private readonly RECALL_SPEED = 500;

  // Variables
  private readonly isDebug;
  private score = 0;
  private time = 0;
  private isRecalling = false;
  private isGameStarted = false;

  // Entities
  private scene!: Scene;
  private sign!: Scoreboard;
  private pool!: Pool;
  private puckParent!: Entity;
  private goalkeeper!: Goalkeeper;
  private farTender!: Goaltender;
  private nearTender!: Goaltender;

  // Sounds
  private ambientSound!: Sound;
  private startSound!: Sound;
  private hornSound!: Sound;
  private slapSound!: Sound;
  private goalSound!: Sound;
  private whistleSound!: Sound;
  private gameSound!: Sound;

  constructor(debug: boolean = false) {
    this.isDebug = debug;
    triggers.enableDebugDraw(false);
    physWorld.setDebugDraw(this.isDebug);
  }

  public run() {
    this.setupGameObjects();
    this.setupTriggers();
    this.setupSounds();
    this.setupSystems();
  }

  private setupGameObjects(): void {
    this.sign = new Scoreboard();
    this.pool = new Pool();
    this.goalkeeper = new Goalkeeper(this.isDebug);

    this.farTender = new Goaltender(
      {
        left: Vector3.create(40, 2.28, 37),
        right: Vector3.create(40, 2.28, 26)
      },
      2,
      this.isDebug
    );

    this.nearTender = new Goaltender(
      {
        left: Vector3.create(32, 2.28, 37),
        right: Vector3.create(32, 2.28, 26)
      },
      1.6,
      this.isDebug
    );

    this.puckParent = engine.addEntity();
    Transform.create(this.puckParent, {
      parent: engine.PlayerEntity,
      position: Vector3.create(0, 0.05, 2.5),
      scale: Vector3.Zero()
    });
    GltfContainer.create(this.puckParent, {
      src: resources.MODEL_PUCK
    });

    this.scene = new Scene(this.isDebug);
  }

  private setupTriggers(): void {
    this.createGameTriggerZone();
    this.createGoalTriggerZone();
  }

  private createGameTriggerZone(): void {
    const thirdViewAreaSize = Vector3.create(8, 3, 15);
    const thirdViewArea = engine.addEntity();
    Transform.create(thirdViewArea, {
      position: Vector3.create(16, 5, 32)
    });

    triggers.addTrigger(
      thirdViewArea,
      NO_LAYERS,
      LAYER_1,
      [{ type: 'box', scale: thirdViewAreaSize }],
      () => {
        this.init();
        this.ambientSound.stop();
      },
      () => {
        this.end();
        this.ambientSound.play();
      },
      Color3.Yellow()
    );

    CameraModeArea.create(thirdViewArea, {
      area: thirdViewAreaSize,
      mode: CameraType.CT_FIRST_PERSON
    });

    AvatarModifierArea.create(thirdViewArea, {
      area: thirdViewAreaSize,
      modifiers: [AvatarModifierType.AMT_DISABLE_PASSPORTS],
      excludeIds: []
    });
  }

  private updateStartTimer(): void {
    const timer = timers.get('startTimer');
    switch (timer.count) {
      case 1:
        this.sign.setText('Score at least', 10);
        break;
      case 2:
        this.sign.setText(`${this.GOAL_TARGET} goals`);
        break;
      case 3:
        this.sign.setText('in 1 minute');
        break;
      case 4:
        this.sign.setText('GOOOO!!!');
        timers.remove('startTimer');
        this.start();
        break;
    }
  }

  private createGoalTriggerZone(): void {
    const goalTriggerZone = engine.addEntity();
    Transform.create(goalTriggerZone, { position: Vector3.create(48, 4, 32) });
    triggers.addTrigger(
      goalTriggerZone,
      NO_LAYERS,
      ALL_LAYERS,
      [{ type: 'box', scale: Vector3.create(3, 4, 5) }],
      (entity: Entity) => {
        const puck = this.pool.getBy(entity) as Puck;
        if (puck.isActive && this.time > 0) {
          puck.setActive(false);
          this.goalSound.play();
          this.scene.playGoalAnimation();
          this.update(++this.score, this.time);
        }
      },
      undefined,
      Color3.Red()
    );
  }

  private setupSounds(): void {
    this.startSound = new Sound(resources.SOUND_START);
    this.hornSound = new Sound(resources.SOUND_HORN);
    this.slapSound = new Sound(resources.SOUND_SLAP);
    this.goalSound = new Sound(resources.SOUND_GOAL);
    this.whistleSound = new Sound(resources.SOUND_WHISTLE);
    this.gameSound = new Sound(resources.SOUND_GAME, true);
    this.ambientSound = new Sound(resources.SOUND_AMBIENT, true);
    this.ambientSound.play();
  }

  private setupSystems(): void {
    engine.addSystem(() => this.gameSystem(), 1, 'gameSystem');
    engine.addSystem((dt) => this.updateSystem(dt), 2, 'updateSystem');
  }

  private gameSystem(): void {
    const pointerDown = inputSystem.getInputCommand(InputAction.IA_POINTER, PointerEventType.PET_DOWN);

    if (pointerDown && this.isGameStarted && !this.isRecalling) {
      const puck = this.pool.get();
      const { body } = puck;

      this.slapSound.play();

      puck.setActive(true);

      const cameraTransform = Transform.get(engine.CameraEntity);
      const shootDirection = Vector3.rotate(Vector3.Forward(), cameraTransform.rotation);
      body.position.set(
        cameraTransform.position.x + shootDirection.x,
        physWorld.getWorldPosition().y + 0.4,
        cameraTransform.position.z + shootDirection.z
      );

      // Shoot
      body.applyImpulse(
        new CANNON.Vec3(
          shootDirection.x * this.SHOOT_VELOCITY,
          shootDirection.x * Math.random() * 10,
          shootDirection.z * this.SHOOT_VELOCITY
        ),
        body.position
      );

      this.isRecalling = true;
      Transform.getMutable(this.puckParent).scale = Vector3.Zero();
      timers.create(
        'recallTimer',
        () => {
          this.puckParent && (Transform.getMutable(this.puckParent).scale = Vector3.One());
          this.isRecalling = false;
        },
        { delay: this.RECALL_SPEED, maxCount: 1 }
      );
    }
  }

  private updateSystem(dt: number): void {
    if (this.isGameStarted) {
      this.goalkeeper.update();
      this.farTender.update();
      this.nearTender.update();
      this.pool.update();
      physWorld.update(dt);
    }
  }

  private update(score: number, time: number) {
    if (time <= 0) {
      const finishedText = score >= this.GOAL_TARGET ? 'WINNER!' : 'TRY AGAIN';
      this.end(finishedText);
      return;
    }

    if (time === 45 || score === 10) {
      this.farTender.start();
    }

    if (time === 30 || score === 15) {
      this.nearTender.start();
    }

    this.sign.setScoreTime(time, score, this.GOAL_TARGET);
  }

  private init() {
    this.scene.playTutorialAnimation();
    this.scene.stopIceMachineAnimation();
    this.startSound.play();
    this.gameSound.play();
    timers.create('startTimer', () => this.updateStartTimer(), { delay: 3100, immediately: true, maxCount: 4 });
  }

  private start() {
    this.score = 0;
    this.time = 60;
    this.hornSound.play();
    timers.create('updateTimer', () => this.update(this.score, --this.time), { delay: 1000 });
    this.goalkeeper.start();
    this.puckParent && (Transform.getMutable(this.puckParent).scale = Vector3.One());
    this.isGameStarted = true;
  }

  private end(text: string = '') {
    timers.remove('startTimer');
    timers.remove('updateTimer');
    timers.remove('recallTimer');

    if (this.isGameStarted) {
      this.whistleSound.play();
    }

    this.startSound.stop();
    this.gameSound.stop();

    this.goalkeeper.stop();
    this.farTender.stop();
    this.nearTender.stop();
    this.sign.setText(text);
    this.score = 0;
    this.time = 0;
    this.isGameStarted = false;
    this.pool.clear();
    this.scene.playIceMachineAnimation();
    Transform.getMutable(this.puckParent).scale = Vector3.Zero();
    this.isRecalling = false;
  }
}
