import {AudioSource, AvatarAnchorPointType, AvatarAttach, engine, Entity, Transform} from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'

export class Sound {
    entity: Entity

    constructor(audioUrl: string, loop: boolean = false) {
        this.entity = engine.addEntity()
        Transform.create(this.entity)

        AudioSource.create(this.entity, {
            audioClipUrl: audioUrl,
            playing: false,
            loop
        })

        AvatarAttach.create(this.entity, {
            anchorPointId: AvatarAnchorPointType.AAPT_POSITION
        })
    }

    public play() {
        if (this.playing) {
            this.stop()
            utils.timers.setTimeout(() => this.playing = true, 100)
        } else {
            this.playing = true
        }
    }

    public stop() {
       this.playing = false
    }

    private set playing(value: boolean) {
        AudioSource.getMutable(this.entity).playing = value
    }

    private get playing(): boolean {
        return Boolean(AudioSource.get(this.entity).playing)
    }
}
