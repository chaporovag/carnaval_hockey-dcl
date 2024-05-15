import {engine, Entity, GltfContainer, Transform, TransformType} from '@dcl/sdk/ecs'

export class Puck {
    entity: Entity = engine.addEntity()
    isFired: boolean = false
    blueGlow: Entity = engine.addEntity()
    orangeGlow: Entity = engine.addEntity()

    constructor(transform: TransformType) {
        Transform.create(this.entity, transform)
        GltfContainer.create(this.entity, {
            src: 'models/Shaiba_V1.glb'
        })
        // MeshRenderer.setCylinder(this.entity, 0.2, 0.2)

        this.setFired(false)
    }

    // Switches between fired states
    setFired(isFired: boolean): void {
        this.isFired = isFired
    }
}
