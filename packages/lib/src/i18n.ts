import { I18nService } from '@/services/i18n.service';
import en from './locales/en.json';
import { WidgetConfiguration } from '@/interfaces/widget-configuration';

/**
 * Returns the canonical form of the locale (e.g. "en_us" becomes "en-US"), or `undefined` when it is not valid
 */
function toLocale(value: string | undefined): string | undefined {
  try {
    return value ? Intl.getCanonicalLocales(value.replaceAll('_', '-'))[0] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get the language from the closest `lang` attribute for the given element.
 * The `lang` attribute is set by the embedding page and may be invalid (e.g. "en_US" or ""): the locale is validated
 * once here, so the `Intl` formatters, which throw on invalid locales, can be used without checks
 *
 * @param element The HTML element
 */
function getLanguage(element: HTMLElement): string {
  const closestElement = element.closest<HTMLElement>('[lang]');

  return toLocale(closestElement?.lang) ?? toLocale(window.navigator.language) ?? 'en';
}

let i18nService: I18nService;

export function createI18n(element: HTMLElement, locales?: WidgetConfiguration['locales']) {
  i18nService = new I18nService({
    locale: getLanguage(element),
    messages: {
      en,
      ...locales,
    },
  });
}

export function useI18n() {
  return i18nService;
}
