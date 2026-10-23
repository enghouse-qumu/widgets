import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { createElement } from 'preact';
import { MenuButtonComponent, MenuOptions, SubMenu } from '../menu-button';

describe('MenuButtonComponent', () => {
  const onSelect = vi.fn();
  const onOpenChange = vi.fn();
  const options: MenuOptions = {
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
    type: 'radio',
  };

  const renderMenu = (props: Partial<Parameters<typeof MenuButtonComponent>[0]> = {}) => render(createElement(MenuButtonComponent, {
    class: 'qc-test',
    icon: 'captions',
    label: 'Captions',
    menu: options,
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
      menu: {
        items: [{
          key: 'like',
          label: '👍',
          onSelect,
        }],
        type: 'action',
      },
    });
    fireEvent.click(button());

    expect(screen.getByRole('menuitem', { name: '👍' })).not.toHaveAttribute('aria-checked');
  });

  describe('submenus', () => {
    const submenus: SubMenu[] = [
      {
        icon: 'playback-rate',
        items: [
          {
            checked: true,
            key: '1',
            label: 'Normal',
            onSelect: () => {
              onSelect('normal');
            },
          },
          {
            checked: false,
            key: '2',
            label: '2×',
            onSelect: () => {
              onSelect('2');
            },
          },
        ],
        key: 'speed',
        label: 'Playback speed',
        type: 'radio',
      },
      {
        icon: 'hd',
        items: [
          {
            checked: true,
            key: 'auto',
            label: 'Auto',
            onSelect: () => {
              onSelect('auto');
            },
          },
        ],
        key: 'quality',
        label: 'Quality',
        type: 'radio',
      },
    ];

    const renderSettings = () => renderMenu({
      backLabel: 'Back to menu',
      label: 'Settings',
      menu: { submenus },
    });
    const settings = () => screen.getByRole('button', { name: 'Settings' });

    it('should list the entries, and open their submenu', () => {
      renderSettings();
      fireEvent.click(settings());

      const speed = screen.getByRole('menuitem', { name: 'Playback speed' });

      expect(speed).toHaveAttribute('aria-haspopup', 'menu');
      expect(speed).toHaveFocus();
      expect(screen.getByRole('menuitem', { name: 'Quality' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitemradio')).toBeNull();

      fireEvent.click(speed);

      expect(screen.getByRole('menu', { name: 'Playback speed' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Back to menu' })).toBeInTheDocument();
      expect(screen.getByRole('menuitemradio', { name: 'Normal' })).toHaveFocus();
      expect(screen.queryByRole('menuitem', { name: 'Quality' })).toBeNull();

      fireEvent.click(screen.getByRole('menuitemradio', { name: '2×' }));

      expect(onSelect).toHaveBeenCalledWith('2');
      expect(screen.queryByRole('menu')).toBeNull();
      expect(settings()).toHaveFocus();
    });

    it('should navigate with the arrow keys, like the player', () => {
      renderSettings();
      fireEvent.click(settings());

      const menu = () => screen.getByRole('menu');

      fireEvent.keyDown(menu(), { key: 'ArrowDown' });
      fireEvent.keyDown(menu(), { key: 'ArrowRight' });

      expect(screen.getByRole('menu', { name: 'Quality' })).toBeInTheDocument();
      expect(screen.getByRole('menuitemradio', { name: 'Auto' })).toHaveFocus();

      fireEvent.keyDown(menu(), { key: 'ArrowLeft' });

      // back to the entries, on the entry of the closed submenu
      expect(screen.getByRole('menu', { name: 'Settings' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Quality' })).toHaveFocus();

      fireEvent.keyDown(menu(), { key: 'Escape' });

      expect(screen.queryByRole('menu')).toBeNull();
      expect(settings()).toHaveFocus();
    });

    it('should return to the entries with the back button', () => {
      renderSettings();
      fireEvent.click(settings());
      fireEvent.click(screen.getByRole('menuitem', { name: 'Quality' }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Back to menu' }));

      expect(screen.getByRole('menuitem', { name: 'Quality' })).toHaveFocus();
    });

    it('should open on the entries again', () => {
      renderSettings();
      fireEvent.click(settings());
      fireEvent.click(screen.getByRole('menuitem', { name: 'Quality' }));
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      fireEvent.click(settings());

      expect(screen.getByRole('menu', { name: 'Settings' })).toBeInTheDocument();
    });
  });
});
