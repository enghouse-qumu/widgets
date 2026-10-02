import { Presentation } from '@/interfaces/presentation';
import { WidgetConfiguration } from '@/interfaces/widget-configuration';
import { ListWidgetSource } from '@/interfaces/list-widget-source';

export interface PresentationList {
  presentations: Presentation[];
  total: number;
}

export interface PresentationResponseDto {
  kulus: Presentation[];
  total: number;
  error: {
    code: string;
    httpCode: number;
    message: string;
  };
}

export class PresentationService {
  constructor(private readonly host: string) {}

  async getPresentation(
    guid: string,
    sortBy = 'created',
    sortOrder: WidgetConfiguration['sortOrder'] = 'DESCENDING',
  ): Promise<Presentation> {
    const url = new URL(`/api/2.2/rest/widgets/${guid}.json`, `https://${this.host}`);

    url.searchParams.set('offset', '0');
    url.searchParams.set('limit', '1');
    url.searchParams.set('sortBy', `${sortBy},${sortOrder}`);
    url.searchParams.set('useUserAuth', 'false');

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
      });
    } catch (err) {
      throw new Error(`Failed to fetch presentation from host "${this.host}": ${(err as Error).message}`, { cause: err });
    }

    const { kulus, error } = await this.readBody(response);

    if (!response.ok || !kulus?.length) {
      throw new Error(error?.message ?? `Failed to fetch presentation with guid "${guid}" from host "${this.host}"`);
    }

    return kulus[0];
  }

  async getPresentations(source: ListWidgetSource): Promise<PresentationList> {
    const url = new URL(this.getListPath(source), `https://${this.host}`);

    url.searchParams.set('offset', String(source.offset ?? 0));

    if (source.limit !== undefined) {
      url.searchParams.set('limit', String(source.limit));
    }

    // without `sortBy`, the API returns the presentation GUIDs in the given order
    if (!('presentationGuids' in source)) {
      url.searchParams.set('sortBy', `${source.sortBy ?? 'created'},${source.sortOrder ?? 'DESCENDING'}`);
    }

    if ('smartSearch' in source) {
      source.smartSearch.rules.forEach(({ field, comparator, value }) => {
        url.searchParams.append('search', `${field},${comparator},${value}`);
      });
      url.searchParams.set('matchAny', String(source.smartSearch.match === 'any'));
    }

    url.searchParams.set('useUserAuth', 'false');

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
      });
    } catch (err) {
      throw new Error(`Failed to fetch presentations from host "${this.host}": ${(err as Error).message}`, { cause: err });
    }

    const { kulus, total, error } = await this.readBody(response);

    if (!response.ok) {
      throw new Error(error?.message ?? `Failed to fetch presentations from host "${this.host}"`);
    }

    return {
      presentations: kulus ?? [],
      total: total ?? kulus?.length ?? 0,
    };
  }

  /**
   * Parses the JSON body of the response. Error responses are not always JSON (e.g. an HTML 502 page from a proxy),
   * their body is then ignored so the caller reports a fetch error instead of a parsing error.
   */
  private async readBody(response: Response): Promise<Partial<PresentationResponseDto>> {
    try {
      return await response.json() as Partial<PresentationResponseDto>;
    } catch (err) {
      if (!response.ok) {
        return {};
      }

      throw new Error(`Invalid response from host "${this.host}": the body is not valid JSON`, { cause: err });
    }
  }

  private getListPath(source: ListWidgetSource): string {
    if ('smartSearchGuid' in source) {
      return `/api/2.2/rest/widgets/${encodeURIComponent(source.smartSearchGuid)}.json`;
    }

    if ('presentationGuids' in source) {
      return `/api/2.2/rest/widgets/${source.presentationGuids.map(encodeURIComponent).join(',')}.json`;
    }

    // the `.json` suffix is required, the API returns XML otherwise
    return '/api/2.2/rest/widgets.json';
  }
}
