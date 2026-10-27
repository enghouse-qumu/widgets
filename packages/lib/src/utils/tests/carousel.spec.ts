import { describe, expect, it } from 'vitest';
import { computePerPage, pageAfterResize, pageCount, parseTransitionDuration, swipeDirection } from '../carousel';

describe('carousel utils', () => {
  describe('computePerPage', () => {
    it('should fit as many min-width columns as possible, with the gap between them', () => {
      // 3 × 240 + 2 × 16 = 752
      expect(computePerPage(752, 240, 16, 'auto', 12)).toBe(3);
      expect(computePerPage(751, 240, 16, 'auto', 12)).toBe(2);
    });

    it('should cap the items per page with a number of columns', () => {
      expect(computePerPage(2000, 240, 16, 2, 12)).toBe(2);
      // fewer than the columns when the items would get too narrow
      expect(computePerPage(500, 240, 16, 4, 12)).toBe(2);
    });

    it('should always show at least one item', () => {
      expect(computePerPage(100, 240, 16, 'auto', 12)).toBe(1);
    });

    it('should show all the items when nothing limits them', () => {
      expect(computePerPage(1000, 0, 0, 'auto', 5)).toBe(5);
      expect(computePerPage(1000, 0, 0, 3, 5)).toBe(3);
    });
  });

  describe('pageCount', () => {
    it('should count the pages, the last one partial', () => {
      expect(pageCount(10, 3)).toBe(4);
      expect(pageCount(9, 3)).toBe(3);
    });

    it('should have one page at least', () => {
      expect(pageCount(0, 3)).toBe(1);
    });
  });

  describe('pageAfterResize', () => {
    it('should keep the item in the middle of the page visible', () => {
      // page 1 of 4 per page shows items 4 to 7, the anchor is item 5
      expect(pageAfterResize(1, 4, 2, 12)).toBe(2);
      expect(pageAfterResize(1, 4, 3, 12)).toBe(1);
      expect(pageAfterResize(2, 2, 4, 12)).toBe(1);
    });

    it('should use the visible items of a partial last page', () => {
      // page 2 of 4 per page shows items 8 and 9 only, the anchor is item 8
      expect(pageAfterResize(2, 4, 3, 10)).toBe(2);
    });

    it('should stay on the first page', () => {
      expect(pageAfterResize(0, 1, 4, 12)).toBe(0);
    });
  });

  describe('swipeDirection', () => {
    it('should change the page beyond 20% of the width', () => {
      expect(swipeDirection(-201, 1000, 1000)).toBe(1);
      expect(swipeDirection(201, 1000, 1000)).toBe(-1);
    });

    it('should go back to the current page for a short and slow drag', () => {
      expect(swipeDirection(-150, 1000, 1000)).toBe(0);
    });

    it('should change the page for a quick flick', () => {
      expect(swipeDirection(-60, 100, 1000)).toBe(1);
    });

    it('should ignore a tiny flick', () => {
      expect(swipeDirection(-5, 1, 1000)).toBe(0);
    });
  });

  describe('parseTransitionDuration', () => {
    it('should parse seconds and milliseconds', () => {
      expect(parseTransitionDuration('0.3s')).toBe(300);
      expect(parseTransitionDuration('250ms')).toBe(250);
    });

    it('should return the longest duration of a list', () => {
      expect(parseTransitionDuration('0s, 400ms')).toBe(400);
    });

    it('should return 0 for an empty value', () => {
      expect(parseTransitionDuration('')).toBe(0);
    });
  });
});
