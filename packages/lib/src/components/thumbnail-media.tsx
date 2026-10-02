import { Presentation } from '@/interfaces/presentation';
import Icon from '@/components/icon';

interface Props {
  // the BEM block of the parent, e.g. `qc-thumbnail` renders `qc-thumbnail__image` and `qc-thumbnail__play-button`
  block: string;
  loading?: 'eager' | 'lazy';
  playIconUrl?: string;
  presentation: Presentation;
}

/**
 * The thumbnail image and the play icon, without the interactive element around them,
 * shared by the presentation widget thumbnail and the list widget items, which are buttons themselves
 */
export function ThumbnailMediaComponent({ block, loading, playIconUrl, presentation }: Readonly<Props>) {
  return (
    <>
      <img
        class={`${block}__image`}
        src={presentation.thumbnail?.cdnUrl || presentation.thumbnail?.url}
        alt=""
        loading={loading}
      />
      {playIconUrl ? (
        <img
          alt=""
          class={`${block}__play-button`}
          src={playIconUrl}
        />
      ) : (
        <Icon
          name="play"
          class={`${block}__play-button ${block}__play-button--default`}
        />
      )}
    </>
  );
}
