import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { createElement, render as renderRoot } from 'preact';
import { ListComponent } from '../list';
import { Presentation } from '@/interfaces/presentation';

vi.mock('@/i18n', () => ({
  useI18n: vi.fn().mockReturnValue({
    getLocale: () => 'en',
    t: vi.fn((key: string) => key),
  }),
}));

vi.mock('../player', () => ({
  PlayerComponent: ({ presentation, widgetOptions }: { presentation: Presentation;
    widgetOptions: { playbackMode: string }; }) => createElement('div', {
    'data-mode': widgetOptions.playbackMode,
    'data-testid': 'player-component',
  }, presentation.title),
}));

describe('ListComponent', () => {
  const presentations: Presentation[] = [
    {
      guid: 'a',
      title: 'A',
    },
    {
      guid: 'b',
      mediaDisplayHeight: 3,
      mediaDisplayWidth: 4,
      title: 'B',
    },
  ];

  const widgetOptions = {
    item: {
      info: { bottom: [{ field: 'title' }] },
      showDurationOverlay: false,
    },
    layout: 'grid' as const,
    style: {},
  };

  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    // like browsers, closing the dialog fires the `close` event
    HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
      this.dispatchEvent(new Event('close'));
    });
  });

  const renderList = (options = {}) => render(createElement(ListComponent, {
    playerParameters: {},
    presentations,
    widgetOptions: {
      ...widgetOptions,
      ...options,
    },
  }));

  it('should render one item per presentation with the layout class', () => {
    const { container } = renderList({ layout: 'vertical' });

    expect(container.querySelector('ul')?.className).toBe('qc-list qc-list--vertical');
    expect(container.querySelectorAll('li.qc-list__item')).toHaveLength(2);
  });

  it('should identify the item buttons by the presentation guid', () => {
    const { container } = renderList();

    const ids = Array.from(container.querySelectorAll('.qc-list-item'), (button) => button.id);

    const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

    expect(ids).toEqual([
      expect.stringMatching(new RegExp(`^qc-list-${uuid}-\\d+-a$`)),
      expect.stringMatching(new RegExp(`^qc-list-${uuid}-\\d+-b$`)),
    ]);
  });

  it('should keep the list semantics, dropped by Safari with `list-style: none`', () => {
    renderList();

    expect(screen.getByRole('list')).toHaveAttribute('role', 'list');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('should keep the description ids unique across widgets, which are separate render roots', () => {
    const roots = [document.createElement('div'), document.createElement('div')];

    roots.forEach((root) => {
      document.body.append(root);
      renderRoot(createElement(ListComponent, {
        playerParameters: {},
        // with a duration, so each item gets a description
        presentations: presentations.map((presentation) => ({
          ...presentation,
          duration: 65_000,
        })),
        widgetOptions: {
          ...widgetOptions,
          item: {
            info: { bottom: [{ field: 'title' }] },
            showDurationOverlay: true,
          },
        },
      }), root);
    });

    const ids = Array.from(document.querySelectorAll<HTMLElement>('[id]'), (element) => element.id);

    // 2 widgets × 2 items × (button + title field + duration description)
    expect(ids).toHaveLength(12);
    expect(document.querySelectorAll('[aria-describedby]')).toHaveLength(4);
    expect(new Set(ids).size).toBe(ids.length);

    // every description points at an element of its own widget
    roots.forEach((root) => {
      root.querySelectorAll('[aria-describedby]').forEach((button) => {
        button.getAttribute('aria-describedby')!.split(' ').forEach((id) => {
          expect(root.contains(document.getElementById(id))).toBe(true);
        });
      });
      renderRoot(null, root);
      root.remove();
    });
  });

  it('should open the clicked presentation in the modal', () => {
    const { container } = renderList();

    fireEvent.click(container.querySelectorAll('.qc-list-item')[1]);

    const player = screen.getByTestId('player-component');

    expect(player.textContent).toBe('B');
    expect(player.dataset.mode).toBe('modal');
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(container.querySelector<HTMLElement>('.qc-dialog')!.style.getPropertyValue('--qc-pw-aspect-ratio')).toBe('4 / 3');
  });

  it('should close the modal', () => {
    const { container } = renderList();

    fireEvent.click(container.querySelectorAll('.qc-list-item')[0]);
    fireEvent.click(container.querySelector('.qc-dialog__close-button')!);

    expect(screen.queryByTestId('player-component')).toBeNull();
  });

  it('should call onItemClick instead of opening the modal', () => {
    const onItemClick = vi.fn();
    const { container } = renderList({ onItemClick });

    fireEvent.click(container.querySelectorAll('.qc-list-item')[0]);

    expect(onItemClick).toHaveBeenCalledWith(presentations[0]);
    expect(screen.queryByTestId('player-component')).toBeNull();
  });
});
