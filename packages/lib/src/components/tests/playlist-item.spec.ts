import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { ComponentProps, createElement } from 'preact';
import { PlaylistItemComponent } from '../playlist-item';
import { defaultPlaylistItem } from '@/services/playlist-configuration.service';
import { MetadataType, Presentation } from '@/interfaces/presentation';

vi.mock('@/i18n', () => ({
  useI18n: vi.fn().mockReturnValue({
    getLocale: () => 'en',
    t: vi.fn((key: string) => key),
  }),
}));

describe('PlaylistItemComponent', () => {
  const presentation: Presentation = {
    duration: 20000,
    guid: 'a',
    metadata: [{
      guid: 'meta',
      html: '<p>See <a href="https://example.com">this</a></p>',
      title: 'Notes',
      type: MetadataType.LargeText,
    }],
    summary: 'Summary',
    title: 'Registration &amp; more',
  };
  const onClick = vi.fn();

  const renderItem = (props: Partial<ComponentProps<typeof PlaylistItemComponent>> = {}) => render(createElement(PlaylistItemComponent, {
    active: false,
    id: 'item',
    index: 3,
    item: defaultPlaylistItem,
    onClick,
    presentation,
    status: 'idle',
    ...props,
  }));

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the title and the duration', () => {
    const { container } = renderItem();

    expect(container.querySelector('.qc-playlist-item__info--left [data-field="title"] dd')?.textContent).toBe('Registration & more');
    expect(container.querySelector('.qc-playlist-item__info--right [data-field="duration"] dd')?.textContent).toBe('00:20');
    // the duration label is hidden, but kept for the screen readers
    expect(container.querySelector('[data-field="duration"] dt')).toHaveClass('qc-sr-only');
  });

  it('should name the button with the title and describe it with the other fields', () => {
    renderItem();

    const button = screen.getByRole('button', { name: 'Registration & more' });

    expect(button).toHaveAttribute('aria-describedby', 'item-right-0');
    expect(button).not.toHaveAttribute('aria-current');
  });

  it('should mark the current item', () => {
    const { container } = renderItem({
      active: true,
      status: 'playing',
    });

    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('aria-current', 'true');
    expect(button.getAttribute('aria-describedby')).toContain('item-status');
    expect(screen.getByText('playlist.Now playing')).toBeInTheDocument();
    expect(container.querySelector('.qc-playlist-item--active')).not.toBeNull();
    expect(container.querySelector('.qc-playlist-item__status use')).toHaveAttribute('href', '#icon-pause');
  });

  it('should mark the watched items', () => {
    const { container } = renderItem({ status: 'watched' });

    expect(screen.getByText('playlist.Watched')).toBeInTheDocument();
    expect(container.querySelector('.qc-playlist-item--watched')).not.toBeNull();
    expect(container.querySelector('.qc-playlist-item__status use')).toHaveAttribute('href', '#icon-restart');
  });

  it('should show the watched time of a partially watched item', () => {
    const { container } = renderItem({ watchedTime: 8000 });

    const value = container.querySelector('[data-field="duration"] dd');

    expect(value?.querySelector('[aria-hidden]')?.textContent).toBe('00:08 / 00:20');
    expect(value?.querySelector('.qc-sr-only')?.textContent).toBe('playlist.TIME_OF_DURATION');
    expect(screen.getByText('playlist.In progress')).toBeInTheDocument();
  });

  it('should select the item on click anywhere on the row', () => {
    const { container } = renderItem();

    fireEvent.click(container.querySelector('[data-field="title"]')!);
    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onClick).toHaveBeenCalledWith(3);
  });

  it('should not select the item on a click on a link', () => {
    renderItem({ item: { info: { left: [{ field: 'meta' }] } } });

    fireEvent.click(screen.getByRole('link', { name: 'this' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('should render the configured fields with their labels and styles', () => {
    const { container } = renderItem({
      item: {
        info: {
          left: [
            { field: 'title' },
            {
              field: 'summary',
              label: 'About',
            },
          ],
        },
      },
      metadataStyle: { summary: { lineClamp: 2 } },
    });

    const summary = container.querySelector('[data-field="summary"]');

    expect(summary?.querySelector('dt')?.textContent).toBe('About');
    expect(summary).toHaveClass('qc-list-item__field--clamp');
    expect(container.querySelector('.qc-playlist-item__info--right')).toBeNull();
  });
});
