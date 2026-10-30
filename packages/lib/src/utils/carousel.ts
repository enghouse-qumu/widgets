// the share of the widget width a drag must exceed to change the page
export const SWIPE_DISTANCE_RATIO = 0.2;
// a quick flick changes the page whatever its distance, in px/ms
export const SWIPE_FLICK_VELOCITY = 0.3;
// below this distance a flick is ignored, and a drag is still a click
export const SWIPE_MIN_DISTANCE = 10;

/**
 * The number of items per page of the multi-item layout: as many `minItemWidth` columns as fit in `width`,
 * with `gap` between them, capped by `columns` when it is a number. At least one item; all the `total` items when
 * nothing limits them.
 */
export function computePerPage(
  width: number,
  minItemWidth: number,
  gap: number,
  columns: 'auto' | number | undefined,
  total: number,
): number {
  const cap = typeof columns === 'number' ? columns : Infinity;
  const fit = minItemWidth + gap > 0 ? Math.floor((width + gap) / (minItemWidth + gap)) : Infinity;
  const perPage = Math.min(fit, cap);

  return Math.max(1, Number.isFinite(perPage) ? perPage : total);
}

export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

/**
 * The page to show when the number of items per page changes, keeping the item in the middle of the current page visible
 */
export function pageAfterResize(page: number, oldPerPage: number, newPerPage: number, total: number): number {
  const visibleOnPage = Math.max(1, Math.min(oldPerPage, total - page * oldPerPage));
  const anchor = page * oldPerPage + Math.floor((visibleOnPage - 1) / 2);

  return Math.max(0, Math.min(Math.floor(anchor / newPerPage), pageCount(total, newPerPage) - 1));
}

/**
 * The direction of the page change at the end of a swipe: -1 previous, 1 next, 0 back to the current page
 *
 * @param distance the horizontal drag distance in px, negative towards the left
 * @param duration the drag duration in ms
 * @param width the width of the widget
 */
export function swipeDirection(distance: number, duration: number, width: number): -1 | 0 | 1 {
  const absDistance = Math.abs(distance);
  const isFlick = absDistance >= SWIPE_MIN_DISTANCE && absDistance / Math.max(duration, 1) >= SWIPE_FLICK_VELOCITY;

  if (absDistance > width * SWIPE_DISTANCE_RATIO || isFlick) {
    // dragging towards the left shows the next page
    return distance < 0 ? 1 : -1;
  }

  return 0;
}

/**
 * The longest duration, in ms, of a computed `transition-duration` value such as "0.3s" or "300ms, 0s"
 */
export function parseTransitionDuration(value: string): number {
  return Math.max(0, ...value.split(',').map((part) => {
    const duration = Number.parseFloat(part);

    if (!Number.isFinite(duration)) {
      return 0;
    }

    return part.trim().endsWith('ms') ? duration : duration * 1000;
  }));
}
