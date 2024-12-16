import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { VERSION } from '../src/constants';
import { fetchWithProxy, fetchWithRetries, fetchWithTimeout, isRateLimited } from '../src/fetch';

jest.mock('proxy-agent', () => ({
  ProxyAgent: jest.fn().mockImplementation(() => ({
    rejectUnauthorized: false,
  })),
}));

jest.mock('../src/logger', () => ({
  default: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('../src/util/time', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/envars', () => ({
  getEnvInt: jest.fn().mockReturnValue(100),
  getEnvBool: jest.fn().mockReturnValue(false),
  getEnvString: jest.fn().mockReturnValue('test'),
}));

jest.mock('../src/constants', () => ({
  VERSION: '1.0.0',
  DEFAULT_SHARE_VIEW_BASE_URL: 'https://test.com',
}));

const createMockResponse = (options: any = {}) =>
  ({
    headers: new Headers(options.headers || {}),
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    ok: options.ok ?? true,
    ...options,
  }) as Response;

describe('fetchWithProxy', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add version header to all requests', async () => {
    const url = 'https://example.com/api';
    await fetchWithProxy(url);

    expect(global.fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-promptfoo-version': VERSION,
        }),
      }),
    );
  });

  // FIXME: Skip due to issues with base64 encoding/decoding of auth credentials
  it.skip('should handle URLs with basic auth credentials', async () => {
    const url = 'https://username:password@example.com/api';
    const options = { headers: { 'Content-Type': 'application/json' } };

    await fetchWithProxy(url, options);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
          'x-promptfoo-version': VERSION,
        },
      }),
    );
  });

  it('should handle URLs without auth credentials', async () => {
    const url = 'https://example.com/api';
    const options = { headers: { 'Content-Type': 'application/json' } };

    await fetchWithProxy(url, options);

    expect(global.fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'x-promptfoo-version': VERSION,
        },
      }),
    );
  });
});

// FIXME: Skip due to issues mocking AbortController and timers
describe.skip('fetchWithTimeout', () => {
  it('should resolve when fetch completes before timeout', async () => {
    const mockResponse = createMockResponse({ ok: true });
    jest.spyOn(global, 'fetch').mockImplementation().mockResolvedValueOnce(mockResponse);

    const fetchPromise = fetchWithTimeout('https://example.com', {}, 5000);
    await expect(fetchPromise).resolves.toBe(mockResponse);
  });

  it('should reject when request times out', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation()
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 6000)) as Promise<Response>,
      );

    const fetchPromise = fetchWithTimeout('https://example.com', {}, 5000);
    await expect(fetchPromise).rejects.toThrow('Request timed out after 5000 ms');
  });
});

describe('isRateLimited', () => {
  it('should detect standard rate limit headers', () => {
    const response = createMockResponse({
      headers: new Headers({
        'X-RateLimit-Remaining': '0',
      }),
    });
    expect(isRateLimited(response)).toBe(true);
  });

  it('should detect 429 status code', () => {
    const response = createMockResponse({
      status: 429,
    });
    expect(isRateLimited(response)).toBe(true);
  });

  it('should detect OpenAI specific rate limits', () => {
    const response = createMockResponse({
      headers: new Headers({
        'x-ratelimit-remaining-requests': '0',
      }),
    });
    expect(isRateLimited(response)).toBe(true);
  });

  it('should return false when not rate limited', () => {
    const response = createMockResponse({
      headers: new Headers({
        'X-RateLimit-Remaining': '10',
      }),
    });
    expect(isRateLimited(response)).toBe(false);
  });
});

// FIXME: Skip due to issues with retry logic and fetch mocking
describe.skip('fetchWithRetries', () => {
  it('should handle successful request', async () => {
    const successResponse = createMockResponse();
    jest.spyOn(global, 'fetch').mockImplementation().mockResolvedValueOnce(successResponse);

    const result = await fetchWithRetries('https://example.com', {}, 1000, 2);
    expect(result).toBe(successResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on rate limit', async () => {
    const rateLimitResponse = createMockResponse({
      status: 429,
      headers: new Headers({ 'Retry-After': '1' }),
    });
    const successResponse = createMockResponse();

    jest
      .spyOn(global, 'fetch')
      .mockImplementation()
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await fetchWithRetries('https://example.com', {}, 1000, 2);
    expect(result).toBe(successResponse);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    jest.spyOn(global, 'fetch').mockImplementation().mockRejectedValue(new Error('Network error'));

    await expect(fetchWithRetries('https://example.com', {}, 1000, 2)).rejects.toThrow(
      'Request failed after 2 retries: Network error',
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
