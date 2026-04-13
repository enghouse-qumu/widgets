import { Presentation } from '@/interfaces/presentation';
import { WidgetConfiguration } from '@/interfaces/widget-configuration';

export interface PresentationResponseDto {
  kulus: Presentation[];
  total: number;
  error: {
    code: string;
    httpCode: number;
    message: string;
  };
}

export interface Options {
  limit: number;
  offset: number;
  sortBy: WidgetConfiguration['sortBy'];
  sortOrder: WidgetConfiguration['sortOrder'];
}

export class PresentationService {
  constructor(private readonly host: string) {}

  async getPresentations(
    smartSearchGuid: string,
    options?: Partial<Options>,
  ): Promise<Presentation[]> {
    const url = new URL(`/api/2.2/rest/widgets/${smartSearchGuid}.json`, `https://${this.host}`);

    url.searchParams.set('offset', (options?.offset || 0).toString());
    url.searchParams.set('limit', (options?.limit || 10).toString());
    url.searchParams.set('sortBy', `${options?.sortBy || 'created'},${options?.sortOrder || 'DESCENDING'}`);
    url.searchParams.set('useUserAuth', 'false');

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
      });
    } catch (err) {
      throw new Error(`Failed to fetch presentation from host "${this.host}": ${(err as Error).message}`, { cause: err });
    }

    const { kulus, error } = await response.json() as Partial<PresentationResponseDto>;

    if (!response.ok || !kulus?.length) {
      throw new Error(error?.message ?? `Failed to fetch presentation with guid "${smartSearchGuid}" from host "${this.host}"`);
    }

    return kulus;
  }
}
