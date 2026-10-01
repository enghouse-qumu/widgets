import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PresentationService, PresentationResponseDto } from '../presentation.service';
import { Presentation, MetadataType } from '@/interfaces/presentation';

describe('PresentationService', () => {
  // Mock fetch globally
  const mockFetch = vi.fn();

  const mockHost = 'example.com';

  let presentationService = new PresentationService(mockHost);

  beforeEach(() => {
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getPresentation', () => {
    const mockGuid = 'test-guid-123';
    const expectedUrl = `https://${mockHost}/api/2.2/rest/widgets/${mockGuid}.json?offset=0&limit=1&sortBy=title%2CASCENDING&useUserAuth=false`;

    const mockPresentation: Presentation = {
      audioOnly: false,
      created: '2023-01-01T00:00:00Z',
      duration: 3600,
      guid: mockGuid,
      public: true,
      title: 'Test Presentation',
      vod: true,
    };

    const mockSuccessResponse: Partial<PresentationResponseDto> = {
      kulus: [mockPresentation],
      total: 1,
    };

    it('should successfully fetch a presentation', async () => {
      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
        ok: true,
      });

      const result = await presentationService.getPresentation(mockGuid, 'title', 'ASCENDING');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
        method: 'GET',
      });
      expect(result).toEqual(mockPresentation);
    });

    it('should construct the correct URL with parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
        ok: true,
      });

      await presentationService.getPresentation(mockGuid, 'title', 'ASCENDING');

      const mockCall = mockFetch.mock.calls[0] as unknown[];
      const url = mockCall[0] as string;

      expect(url).toBe(expectedUrl);
    });

    it('should throw error when fetch fails due to network error', async () => {
      const networkError = new Error('Network error');

      mockFetch.mockRejectedValueOnce(networkError);

      await expect(
        presentationService.getPresentation(mockGuid, 'title', 'ASCENDING'),
      ).rejects.toThrow(`Failed to fetch presentation from host "${mockHost}": Network error`);
    });

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
        ok: false,
      });

      await expect(
        presentationService.getPresentation(mockGuid, 'title', 'ASCENDING'),
      ).rejects.toThrow(`Failed to fetch presentation with guid "${mockGuid}" from host "${mockHost}"`);
    });

    it('should throw error when no presentations are returned', async () => {
      const emptyResponse: Partial<PresentationResponseDto> = {
        kulus: [],
        total: 0,
      };

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(emptyResponse),
        ok: true,
      });

      await expect(
        presentationService.getPresentation(mockGuid, 'title', 'ASCENDING'),
      ).rejects.toThrow(`Failed to fetch presentation with guid "${mockGuid}" from host "${mockHost}"`);
    });

    it('should handle special characters in guid and host', async () => {
      const specialGuid = 'guid-with-special-chars123';
      const specialHost = 'test-host.example.com';

      presentationService = new PresentationService(specialHost);

      const expectedSpecialUrl = `https://${specialHost}/api/2.2/rest/widgets/${specialGuid}.json?offset=0&limit=1&sortBy=title%2CASCENDING&useUserAuth=false`;

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          ...mockSuccessResponse,
          kulus: [
            {
              ...mockPresentation,
              guid: specialGuid,
            },
          ],
        }),
        ok: true,
      });

      const result = await presentationService.getPresentation(specialGuid, 'title', 'ASCENDING');

      expect(mockFetch).toHaveBeenCalledWith(expectedSpecialUrl, {
        method: 'GET',
      });
      expect(result.guid).toBe(specialGuid);
    });

    it('should return the first presentation when multiple are returned', async () => {
      const multipleResponse: Partial<PresentationResponseDto> = {
        kulus: [
          mockPresentation,
          {
            ...mockPresentation,
            guid: 'second-guid',
            title: 'Second Presentation',
          },
          {
            ...mockPresentation,
            guid: 'third-guid',
            title: 'Third Presentation',
          },
        ],
        total: 3,
      };

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(multipleResponse),
        ok: true,
      });

      const result = await presentationService.getPresentation(mockGuid, mockHost);

      expect(result).toEqual(mockPresentation);
      expect(result.guid).toBe(mockGuid);
      expect(result.title).toBe('Test Presentation');
    });

    it('should handle JSON parsing errors', async () => {
      const parseError = new SyntaxError('Unexpected token');

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockRejectedValue(parseError),
        ok: true,
      });

      const result = presentationService.getPresentation(mockGuid, mockHost);

      await expect(result).rejects.toThrow('the body is not valid JSON');
      await expect(result).rejects.toHaveProperty('cause', parseError);
    });

    it('should report the HTTP status when an error response is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token \'<\'')),
        ok: false,
        status: 502,
      });

      await expect(presentationService.getPresentation(mockGuid))
        .rejects.toThrow(new RegExp(`^Failed to fetch presentation with guid "${mockGuid}" from host ".+" \\(HTTP 502\\)$`));
    });

    it('should handle presentations with minimal data', async () => {
      const minimalPresentation: Presentation = {
        guid: mockGuid,
      };

      const minimalResponse: Partial<PresentationResponseDto> = {
        kulus: [minimalPresentation],
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(minimalResponse),
        ok: true,
      });

      const result = await presentationService.getPresentation(mockGuid, mockHost);

      expect(result).toEqual(minimalPresentation);
      expect(result.guid).toBe(mockGuid);
      expect(result.title).toBeUndefined();
    });

    it('should handle presentations with complete metadata', async () => {
      const completePresentation: Presentation = {
        audioOnly: true,
        created: '2023-01-01T00:00:00Z',
        duration: 7200,
        guid: mockGuid,
        metadata: [
          {
            guid: 'meta-guid-1',
            html: '<p>Test summary</p>',
            title: 'Summary',
            type: MetadataType.Text,
          },
        ],
        player: 'html5',
        public: true,
        published: new Date('2023-01-01T12:00:00Z'),
        publisher: {
          guid: 'user-guid',
          name: 'John Doe',
          username: 'johndoe',
        },
        summary: 'Test summary',
        thumbnail: {
          autoGenerated: false,
          cdnUrl: 'https://cdn.example.com/thumb.jpg',
          height: 480,
          url: 'https://example.com/thumb.jpg',
          width: 640,
        },
        title: 'Complete Test Presentation',
        vod: true,
      };

      const completeResponse: Partial<PresentationResponseDto> = {
        kulus: [completePresentation],
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(completeResponse),
        ok: true,
      });

      const result = await presentationService.getPresentation(mockGuid, mockHost);

      expect(result).toEqual(completePresentation);
      expect(result.metadata).toHaveLength(1);
      expect(result.publisher?.name).toBe('John Doe');
      expect(result.thumbnail?.autoGenerated).toBe(false);
    });
  });

  describe('getPresentations', () => {
    const listService = new PresentationService(mockHost);
    const base = `https://${mockHost}/api/2.2/rest/widgets`;
    const mockPresentations: Presentation[] = [
      {
        guid: 'a',
        title: 'A',
      },
      {
        guid: 'b',
        title: 'B',
      },
    ];

    const mockResponse = (body: Partial<PresentationResponseDto>, ok = true) => {
      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(body),
        ok,
      });
    };

    const calledUrl = () => new URL(mockFetch.mock.calls[0][0] as string);

    it('should fetch a smart search (playlist) by guid', async () => {
      mockResponse({
        kulus: mockPresentations,
        total: 20,
      });

      const result = await listService.getPresentations({
        host: mockHost,
        limit: 12,
        smartSearchGuid: 'playlist-guid',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${base}/playlist-guid.json?offset=0&limit=12&sortBy=created%2CDESCENDING&useUserAuth=false`,
        { method: 'GET' },
      );
      expect(result).toEqual({
        presentations: mockPresentations,
        total: 20,
      });
    });

    it('should join presentation guids in the path', async () => {
      mockResponse({ kulus: mockPresentations });

      await listService.getPresentations({
        host: mockHost,
        offset: 5,
        presentationGuids: ['a', 'b'],
        sortBy: 'title',
        sortOrder: 'ASCENDING',
      });

      const url = calledUrl();

      expect(url.pathname).toBe('/api/2.2/rest/widgets/a,b.json');
      expect(url.searchParams.get('offset')).toBe('5');
      expect(url.searchParams.has('limit')).toBe(false);
      expect(url.searchParams.get('sortBy')).toBe('title,ASCENDING');
    });

    it('should not sort presentation guids by default, to keep their order', async () => {
      mockResponse({ kulus: mockPresentations });

      await listService.getPresentations({
        host: mockHost,
        presentationGuids: ['b', 'a'],
      });

      expect(calledUrl().pathname).toBe('/api/2.2/rest/widgets/b,a.json');
      expect(calledUrl().searchParams.has('sortBy')).toBe(false);
    });

    it('should sort presentation guids when only sortOrder is set', async () => {
      mockResponse({ kulus: mockPresentations });

      await listService.getPresentations({
        host: mockHost,
        presentationGuids: ['b', 'a'],
        sortOrder: 'ASCENDING',
      });

      expect(calledUrl().searchParams.get('sortBy')).toBe('created,ASCENDING');
    });

    it('should send the ad-hoc smart search rules', async () => {
      mockResponse({ kulus: [] });

      await listService.getPresentations({
        host: mockHost,
        smartSearch: {
          match: 'any',
          rules: [
            {
              comparator: 'contains',
              field: 'title',
              value: 'demo',
            },
            {
              comparator: 'is',
              field: 'md:abc',
              value: 'x,y',
            },
          ],
        },
      });

      const url = calledUrl();

      expect(url.pathname).toBe('/api/2.2/rest/widgets.json');
      expect(url.searchParams.getAll('search')).toEqual(['title,contains,demo', 'md:abc,is,x,y']);
      expect(url.searchParams.get('matchAny')).toBe('true');
    });

    it('should set matchAny to false when all rules must match', async () => {
      mockResponse({ kulus: [] });

      await listService.getPresentations({
        host: mockHost,
        smartSearch: {
          match: 'all',
          rules: [
            {
              comparator: 'is',
              field: 'title',
              value: 'a',
            },
          ],
        },
      });

      expect(calledUrl().searchParams.get('matchAny')).toBe('false');
    });

    it('should return an empty list when there are no results', async () => {
      mockResponse({});

      await expect(listService.getPresentations({
        host: mockHost,
        smartSearchGuid: 'x',
      })).resolves.toEqual({
        presentations: [],
        total: 0,
      });
    });

    it('should throw the API error when the response is not ok', async () => {
      mockResponse({
        error: {
          code: 'NOT_FOUND',
          httpCode: 404,
          message: 'Playlist not found',
        },
      }, false);

      await expect(listService.getPresentations({
        host: mockHost,
        smartSearchGuid: 'x',
      })).rejects.toThrow('Playlist not found');
    });

    it('should report the HTTP status when an error response is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token \'<\'')),
        ok: false,
        status: 502,
      });

      await expect(listService.getPresentations({
        host: mockHost,
        smartSearchGuid: 'x',
      })).rejects.toThrow(`Failed to fetch presentations from host "${mockHost}" (HTTP 502)`);
    });

    it('should throw a clear error when a successful response is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
        ok: true,
      });

      await expect(listService.getPresentations({
        host: mockHost,
        smartSearchGuid: 'x',
      })).rejects.toThrow(`Invalid response from host "${mockHost}": the body is not valid JSON`);
    });

    it('should throw when the network request fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('offline'));

      await expect(listService.getPresentations({
        host: mockHost,
        smartSearchGuid: 'x',
      })).rejects.toThrow(`Failed to fetch presentations from host "${mockHost}": offline`);
    });
  });
});
