type StyleValue = string | number | boolean;

interface StyleObject {
  [key: string]: StyleValue | StyleObject | undefined | null;
}

const toKebabCase = (str: string) => str
  .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase();

/**
 * Maps a Position (e.g. "top-left") onto a `place-items` value
 */
export function positionToPlaceItems(value: string): string {
  const place = (start: string, end: string) => {
    if (value.includes(start)) {
      return 'start';
    }

    return value.includes(end) ? 'end' : 'center';
  };

  const placeX = place('left', 'right');
  const placeY = place('top', 'bottom');

  return `${placeY} ${placeX}`;
}

/**
 * The `grid-template-columns` of a list grid with at most `columns` columns, from the `--qc-lw-*` tokens.
 * `columns` is a maximum, `minItemWidth` has priority: the column minimum is the widest of `minItemWidth`
 * and the width of 1/N of the row, so at most N columns fit and fewer when the items would be too narrow.
 * The percentages resolve against the grid, where the value is used.
 */
export function maxColumnsTemplate(columns: number): string {
  const maxColumnWidth = `(100% - ${columns - 1} * var(--qc-lw-gap)) / ${columns}`;

  return `repeat(auto-fill, minmax(min(max(var(--qc-lw-min-item-width), ${maxColumnWidth}), 100%), 1fr))`;
}

/**
 * Walks a (nested) style object and sets each leaf as a CSS custom property on the element,
 * e.g. `{ playButton: { backgroundColor: '#fff' } }` becomes `--{prefix}-play-button-background-color: #fff`.
 *
 * @param element the element to set the custom properties on
 * @param style the style object
 * @param prefix the custom property prefix, e.g. `--qc-pw`
 * @param mapValue optional mapping of a value, given the full custom property name.
 *                 Returning `undefined` skips the property.
 */
export function setCssVariables(
  element: HTMLElement,
  style: StyleObject,
  prefix: string,
  mapValue: (name: string, value: StyleValue) => string | undefined = (_, value) => String(value),
) {
  const walk = (obj: StyleObject, path: string[] = []) => {
    for (const [key, value] of Object.entries(obj)) {
      const nextPath = [...path, toKebabCase(key)];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value, nextPath);
      } else if (value !== undefined && value !== null) {
        const cssVarName = `${prefix}-${nextPath.join('-')}`;
        const mapped = mapValue(cssVarName, value as StyleValue);

        if (mapped !== undefined) {
          element.style.setProperty(cssVarName, mapped);
        }
      }
    }
  };

  walk(style);
}
