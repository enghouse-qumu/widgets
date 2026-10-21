import { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import Icon from '@/components/icon';

export interface MenuItem {
  key: string;
  label: string;
  // radio items show their state, the others are plain actions (e.g. the reactions)
  checked?: boolean;
  onSelect(): void;
}

export interface MenuGroup {
  // the visible title of the group, e.g. "Playback speed" in the settings menu
  label?: string;
  items: MenuItem[];
  // `radio`: a single choice, `action`: plain actions
  type: 'radio' | 'action';
}

interface Props {
  class: string;
  disabled?: boolean;
  groups: MenuGroup[];
  icon: string;
  // the accessible name of the button and the menu
  label: string;
  onOpenChange?(open: boolean): void;
}

/**
 * A button opening a menu of options, following the menu button pattern of the WAI-ARIA practices:
 * the arrow keys move between the items, Escape closes the menu and returns the focus to the button.
 * The menu also closes on a click outside and when the window loses the focus, e.g. on a click in the player iframe.
 */
export function MenuButtonComponent({ class: className, disabled, groups, icon, label, onOpenChange }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const setMenuOpen = (value: boolean, returnFocus = false) => {
    setOpen(value);
    onOpenChange?.(value);

    if (!value && returnFocus) {
      buttonRef.current?.focus();
    }
  };

  const getItems = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);

  useEffect(() => {
    if (!open) {
      return;
    }

    // the checked item, or the first one, takes the focus
    const items = getItems();

    (items.find((item) => item.getAttribute('aria-checked') === 'true') ?? items[0])?.focus();

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
    const index = items.indexOf(document.activeElement as HTMLElement);
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
        <div ref={menuRef} class="qc-menu__list" role="menu" aria-label={label} onKeyDown={handleMenuKeyDown}>
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} class="qc-menu__group" role="group" aria-label={group.label}>
              {group.label && <div class="qc-menu__group-label" aria-hidden="true">{group.label}</div>}
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  class="qc-menu__item"
                  role={group.type === 'radio' ? 'menuitemradio' : 'menuitem'}
                  aria-checked={group.type === 'radio' ? !!item.checked : undefined}
                  tabIndex={-1}
                  onClick={() => select(item)}
                >
                  {group.type === 'radio' && <Icon name="check" class="qc-menu__check"/>}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
