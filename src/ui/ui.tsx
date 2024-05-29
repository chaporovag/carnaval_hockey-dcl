import { openExternalUrl } from '~system/RestrictedActions';
import ReactEcs, { Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs';
import resources from '../core/resources';

export function setupUi() {
  ReactEcsRenderer.setUiRenderer(GitHubLinkUi);
}

function GitHubLinkUi() {
  return (
    <UiEntity
      uiTransform={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        positionType: 'absolute',
        position: { right: '3%', bottom: '3%' }
      }}
    >
      <UiEntity
        uiTransform={{
          width: '100',
          height: '100'
        }}
        uiBackground={{
          textureMode: 'stretch',
          texture: {
            src: resources.IMAGE_GITHUB
          }
        }}
        onMouseDown={() => {
          openExternalUrl({ url: resources.LINK_GITHUB });
        }}
      />
      <Label value="View project" fontSize={18} textAlign="middle-center" />
    </UiEntity>
  );
}
