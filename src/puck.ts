import {engine, Entity, MeshRenderer, Transform, TransformType} from '@dcl/sdk/ecs'

export class Puck {
    entity: Entity = engine.addEntity()
    isFired: boolean = false
    blueGlow: Entity = engine.addEntity()
    orangeGlow: Entity = engine.addEntity()

    constructor(transform: TransformType) {
        transform.scale = {
            x: transform.scale.x,
            y: 0.1,
            z: transform.scale.z
        };
        Transform.create(this.entity, transform)

        MeshRenderer.setCylinder(this.entity, 0.2, 0.2)

        this.setFired(false)
    }

    // Switches between fired states
    setFired(isFired: boolean): void {
        this.isFired = isFired
    }
}
