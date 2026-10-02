import { RenderableProps } from 'preact';
import { useI18n } from '@/i18n';
import Icon from '@/components/icon';

interface Props {
  // translation key of the message
  message?: string;
}

export function NotFoundComponent({ message = 'common.Presentation not found' }: Readonly<RenderableProps<Props>>) {
  const i18n = useI18n();

  return (
    <div class="qc-not-found">
      <Icon name="image-broken" width={48} height={48}/>
      <div>{ i18n.t(message) }</div>
    </div>
  );
}
