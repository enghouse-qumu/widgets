import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { createElement } from 'preact';
import { MenuButtonComponent, MenuGroup } from '../menu-button';

describe('MenuButtonComponent', () => {
  const onSelect = vi.fn();
  const onOpenChange = vi.fn();
  const groups: MenuGroup[] = [
    {
      items: [
        {
          checked: false,
          key: 'off',
          label: 'Off',
          onSelect: () => {
            onSelect('off');
          },
        },
        {
          checked: true,
          key: 'en',
          label: 'English',
          onSelect: () => {
            onSelect('en');
          },
        },
        {
          checked: false,
          key: 'fr',
          label: 'French',
          onSelect: () => {
            onSelect('fr');
          },
        },
      ],
      label: 'Captions',
      type: 'radio',
    },
  ];

  const renderMenu = (props: Partial<Parameters<typeof MenuButtonComponent>[0]> = {}) => render(createElement(MenuButtonComponent, {
    class: 'qc-test',
    groups,
    icon: 'captions',
    label: 'Captions',
    onOpenChange,
    ...props,
  }));

  const button = () => screen.getByRole('button', { name: 'Captions' });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should open the menu and focus the checked item', () => {
    renderMenu();

    expect(button()).toHaveAttribute('aria-haspopup', 'menu');
    expect(button()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button());

    expect(button()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu', { name: 'Captions' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toHaveFocus();
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'French' })).toHaveAttribute('aria-checked', 'false');
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('should move between the items with the arrow keys', () => {
    renderMenu();
    fireEvent.click(button());

    const menu = screen.getByRole('menu');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });

    expect(screen.getByRole('menuitemradio', { name: 'French' })).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });

    expect(screen.getByRole('menuitemradio', { name: 'Off' })).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowUp' });

    expect(screen.getByRole('menuitemradio', { name: 'French' })).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'Home' });

    expect(screen.getByRole('menuitemradio', { name: 'Off' })).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'End' });

    expect(screen.getByRole('menuitemradio', { name: 'French' })).toHaveFocus();
  });

  it('should open the menu with the arrow keys', () => {
    renderMenu();
    fireEvent.keyDown(button(), { key: 'ArrowDown' });

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should select an item, close the menu and return the focus', () => {
    renderMenu();
    fireEvent.click(button());
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'French' }));

    expect(onSelect).toHaveBeenCalledWith('fr');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(button()).toHaveFocus();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('should close on Escape and return the focus', () => {
    renderMenu();
    fireEvent.click(button());
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(screen.queryByRole('menu')).toBeNull();
    expect(button()).toHaveFocus();
  });

  it('should close on a click outside', () => {
    renderMenu();
    fireEvent.click(button());
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('should close when the window loses the focus, e.g. on a click in the player', () => {
    renderMenu();
    fireEvent.click(button());
    fireEvent.blur(window);

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('should render the action items without state', () => {
    renderMenu({
      groups: [{
        items: [{
          key: 'like',
          label: '👍',
          onSelect,
        }],
        type: 'action',
      }],
    });
    fireEvent.click(button());

    expect(screen.getByRole('menuitem', { name: '👍' })).not.toHaveAttribute('aria-checked');
  });
});
