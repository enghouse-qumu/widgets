import { afterEach, describe, expect, it, vi } from 'vitest';
import { createI18n, useI18n } from '@/i18n';

describe('i18n', () => {
  const localeFor = (lang?: string) => {
    const element = document.createElement('div');

    if (lang !== undefined) {
      element.setAttribute('lang', lang);
    }

    document.body.append(element);
    createI18n(element);

    return useI18n().getLocale();
  };

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should use the closest lang attribute', () => {
    expect(localeFor('fr-CA')).toBe('fr-CA');
  });

  it('should canonicalize the lang attribute', () => {
    expect(localeFor('en_us')).toBe('en-US');
  });

  it.each(['', 'not a locale'])('should fall back to the browser language for the invalid lang "%s"', (lang) => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');

    expect(localeFor(lang)).toBe('de-DE');
  });

  it('should fall back to english when the browser language is not valid either', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('');

    expect(localeFor()).toBe('en');
  });

  it('should always give a locale usable by the Intl formatters', () => {
    const locale = localeFor('en_US');

    expect(() => new Intl.DateTimeFormat(locale)).not.toThrow();
  });
});
