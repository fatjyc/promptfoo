import { describe, it, expect } from '@jest/globals';
import { stripAuthFromUrl } from '../src/share';

describe('stripAuthFromUrl', () => {
  it('removes username and password from URL', () => {
    const input = 'https://user:pass@example.com/path?query=value#hash';
    const expected = 'https://example.com/path?query=value#hash';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('handles URLs without auth info', () => {
    const input = 'https://example.com/path?query=value#hash';
    expect(stripAuthFromUrl(input)).toBe(input);
  });

  it('handles URLs with only username', () => {
    const input = 'https://user@example.com/path';
    const expected = 'https://example.com/path';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('handles URLs with special characters in auth', () => {
    const input = 'https://user%40:p@ss@example.com/path';
    const expected = 'https://example.com/path';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('returns original string for invalid URLs', () => {
    const input = 'not a valid url';
    expect(stripAuthFromUrl(input)).toBe(input);
  });

  it('handles URLs with IP addresses', () => {
    const input = 'http://user:pass@192.168.1.1:8080/path';
    const expected = 'http://192.168.1.1:8080/path';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('handles URLs with empty username/password', () => {
    const input = 'https://:@example.com/path';
    const expected = 'https://example.com/path';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('preserves query parameters and fragments', () => {
    const input = 'https://user:pass@example.com/path?a=1&b=2#section';
    const expected = 'https://example.com/path?a=1&b=2#section';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('handles URLs with port numbers', () => {
    const input = 'https://user:pass@example.com:8443/path';
    const expected = 'https://example.com:8443/path';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });

  it('handles URLs with multiple @ symbols in query params', () => {
    const input = 'https://user:pass@example.com/path?email=test@example.com';
    const expected = 'https://example.com/path?email=test@example.com';
    expect(stripAuthFromUrl(input)).toBe(expected);
  });
});
