import { JSX } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import Icon from '@/components/icon';

export interface MenuItem {
  key: string;
  label: string;
  // radio items show their state, the others are plain actions (e.g. the reactions)
  checked?: boolean;
  onSelect(): void;
}

// a list of options: `radio` for a single choice, `action` for plain actions
export interface MenuOptions {
  items: MenuItem[];
  type: 'radio' | 'action';
}

// an entry of the menu opening its own options, like the settings menu of the player
export interface SubMenu extends MenuOptions {
  icon: string;
  key: string;
  label: string;
}

interface Props {
  // the accessible name of the button which returns to the entries of the menu
  backLabel?: string;
  class: string;
  disabled?: boolean;
  icon: string;
  // the accessible name of the button and the menu
  label: string;
  // the options, or the entries opening submenus
  menu: MenuOptions | { submenus: SubMenu[] };
  onOpenChange?(open: boolean): void;
}

/**
 * A button opening a menu of options, following the menu button pattern of the WAI-ARIA practices:
 * the arrow keys move between the items, Escape closes the menu and returns the focus to the button.
 * The menu also closes on a click outside and when the window loses the focus, e.g. on a click in the player iframe.
 *
 * Like the settings menu of the player, a menu can list entries which open submenus in place: Right arrow or a click
 * opens one, Left arrow or its back button returns to the entries.
 */
export function MenuButtonComponent({ backLabel, class: className, disabled, icon, label, menu, onOpenChange }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  // the key of the open submenu, null for the entries
  const [submenuKey, setSubmenuKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // the entry to focus when returning from its submenu
  const returnToRef = useRef<string | null>(null);

  const submenus = 'submenus' in menu ? menu.submenus : null;
  // the submenu may have disappeared, e.g. when the item changes
  const submenu = submenus?.find(({ key }) => key === submenuKey) ?? null;

  const setMenuOpen = (value: boolean, returnFocus = false) => {
    setOpen(value);
    setSubmenuKey(null);
    setDirection('forward');
    returnToRef.current = null;
    onOpenChange?.(value);

    if (!value && returnFocus) {
      buttonRef.current?.focus();
    }
  };

  const getItems = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);

  const openSubmenu = (key: string) => {
    returnToRef.current = key;
    setDirection('forward');
    setSubmenuKey(key);
  };

  const closeSubmenu = () => {
    setDirection('back');
    setSubmenuKey(null);
  };

  // when a panel is shown: the entry of the closed submenu, the checked option, or the first item takes the focus
  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const items = getItems();
    const entry = !submenu && returnToRef.current
      ? items.find((item) => item.dataset.submenu === returnToRef.current)
      : undefined;
    const options = items.filter((item) => !item.classList.contains('qc-menu__back'));

    (entry ?? options.find((item) => item.getAttribute('aria-checked') === 'true') ?? options[0])?.focus();
  }, [open, submenu?.key]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleBlur = () => setMenuOpen(false);

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [open]);

  // the menu is closed when the button is disabled or removed, e.g. when the item changes
  useEffect(() => {
    if (disabled && open) {
      setMenuOpen(false);
    }
  }, [disabled]);

  useEffect(() => () => {
    if (open) {
      onOpenChange?.(false);
    }
  }, [open]);

  const handleMenuKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
    const items = getItems();
    const focused = document.activeElement as HTMLElement;
    const index = items.indexOf(focused);
    const focus = (next: number) => {
      event.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    };

    switch (event.key) {
      case 'ArrowDown':
        focus(index + 1);
        break;
      case 'ArrowUp':
        focus(index - 1);
        break;
      case 'Home':
        focus(0);
        break;
      case 'End':
        focus(items.length - 1);
        break;
      case 'ArrowRight':
        if (focused.dataset.submenu) {
          event.preventDefault();
          openSubmenu(focused.dataset.submenu);
        }
        break;
      case 'ArrowLeft':
        if (submenu) {
          event.preventDefault();
          closeSubmenu();
        }
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        setMenuOpen(false, true);
        break;
      case 'Tab':
        setMenuOpen(false);
        break;
      default:
        break;
    }
  };

  const handleButtonKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setMenuOpen(true);
    }
  };

  const select = (item: MenuItem) => {
    item.onSelect();
    setMenuOpen(false, true);
  };

  const renderOptions = ({ items, type }: MenuOptions) => items.map((item) => (
    <button
      key={item.key}
      type="button"
      class="qc-menu__item"
      role={type === 'radio' ? 'menuitemradio' : 'menuitem'}
      aria-checked={type === 'radio' ? !!item.checked : undefined}
      tabIndex={-1}
      onClick={() => select(item)}
    >
      {item.label}
    </button>
  ));

  const renderPanel = () => {
    if (!submenus) {
      return renderOptions(menu as MenuOptions);
    }

    if (submenu) {
      return (
        <>
          <button
            type="button"
            class="qc-menu__item qc-menu__back"
            role="menuitem"
            aria-label={backLabel}
            tabIndex={-1}
            onClick={closeSubmenu}
          >
            <Icon name="chevron-left" class="qc-menu__icon"/>
            {submenu.label}
          </button>
          <hr class="qc-menu__separator"/>
          {renderOptions(submenu)}
        </>
      );
    }

    return submenus.map((entry) => (
      <button
        key={entry.key}
        type="button"
        class="qc-menu__item"
        role="menuitem"
        aria-haspopup="menu"
        data-submenu={entry.key}
        tabIndex={-1}
        onClick={() => openSubmenu(entry.key)}
      >
        <Icon name={entry.icon} class="qc-menu__icon"/>
        <span class="qc-menu__label">{entry.label}</span>
        <Icon name="chevron-left" class="qc-menu__icon qc-menu__chevron"/>
      </button>
    ));
  };

  return (
    <div ref={rootRef} class={`qc-menu ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        class="qc-playlist-controls__button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setMenuOpen(!open)}
        onKeyDown={handleButtonKeyDown}
      >
        <Icon name={icon}/>
      </button>
      {open && (
        <div ref={menuRef} class="qc-menu__list" role="menu" aria-label={submenu?.label ?? label} onKeyDown={handleMenuKeyDown}>
          {/* a new panel for each submenu, so it slides in */}
          <div key={submenu?.key ?? 'entries'} class={`qc-menu__panel qc-menu__panel--${direction}`}>
            {renderPanel()}
          </div>
        </div>
      )}
    </div>
  );
}
