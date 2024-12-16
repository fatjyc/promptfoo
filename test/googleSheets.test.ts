import { jest, describe, expect, it, beforeEach } from '@jest/globals';
import {
  checkGoogleSheetAccess,
  fetchCsvFromGoogleSheetUnauthenticated,
  fetchCsvFromGoogleSheetAuthenticated,
  fetchCsvFromGoogleSheet,
  writeCsvToGoogleSheet,
} from '../src/googleSheets';

jest.mock('../src/logger', () => ({
  default: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../src/fetch', () => ({
  fetchWithProxy: jest.fn(),
}));

jest.mock('@googleapis/sheets', () => ({
  sheets: jest.fn(() => ({
    spreadsheets: {
      get: jest.fn(),
      values: {
        get: jest.fn(),
        update: jest.fn(),
      },
    },
  })),
  auth: {
    GoogleAuth: jest.fn().mockImplementation(() => ({
      getClient: jest.fn(),
    })),
  },
}));

describe('googleSheets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({} as Response));
  });

  describe('checkGoogleSheetAccess', () => {
    it('should return public true when sheet is accessible', async () => {
      jest.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const result = await checkGoogleSheetAccess(
        'https://docs.google.com/spreadsheets/d/123/edit',
      );
      expect(result).toEqual({ public: true, status: 200 });
    });

    it('should return public false when sheet is not accessible', async () => {
      jest.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as Response);

      const result = await checkGoogleSheetAccess(
        'https://docs.google.com/spreadsheets/d/123/edit',
      );
      expect(result).toEqual({ public: false, status: 403 });
    });

    it('should handle network errors', async () => {
      jest.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkGoogleSheetAccess(
        'https://docs.google.com/spreadsheets/d/123/edit',
      );
      expect(result).toEqual({ public: false });
    });
  });

  describe('fetchCsvFromGoogleSheetUnauthenticated', () => {
    it('should fetch and parse CSV data', async () => {
      const mockCsvData = 'header1,header2\nvalue1,value2';
      const { fetchWithProxy } = (await import('../src/fetch')) as any;
      jest.mocked(fetchWithProxy as any).mockResolvedValueOnce({
        status: 200,
        text: () => Promise.resolve(mockCsvData),
      } as Response);

      const result = await fetchCsvFromGoogleSheetUnauthenticated(
        'https://docs.google.com/spreadsheets/d/123/edit',
      );
      expect(result).toEqual([{ header1: 'value1', header2: 'value2' }]);
    });

    it('should throw error on failed fetch', async () => {
      const { fetchWithProxy } = (await import('../src/fetch')) as any;
      jest.mocked(fetchWithProxy as any).mockResolvedValueOnce({
        status: 404,
      } as Response);

      await expect(
        fetchCsvFromGoogleSheetUnauthenticated('https://docs.google.com/spreadsheets/d/123/edit'),
      ).rejects.toThrow('Failed to fetch CSV from Google Sheets URL');
    });
  });

  describe('fetchCsvFromGoogleSheetAuthenticated', () => {
    const mockSheets = {
      spreadsheets: {
        get: jest.fn(),
        values: {
          get: jest.fn(),
        },
      },
    } as any;

    beforeEach(() => {
      const { sheets } = require('@googleapis/sheets') as any;
      jest.mocked(sheets).mockReturnValue(mockSheets);
    });

    it('should fetch and parse authenticated sheet data', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: {
          values: [
            ['header1', 'header2'],
            ['value1', 'value2'],
          ],
        },
      } as any);

      const result = await fetchCsvFromGoogleSheetAuthenticated(
        'https://docs.google.com/spreadsheets/d/123/edit',
      );
      expect(result).toEqual([{ header1: 'value1', header2: 'value2' }]);
    });

    it('should throw error for invalid URL', async () => {
      await expect(fetchCsvFromGoogleSheetAuthenticated('invalid-url')).rejects.toThrow(
        'Invalid Google Sheets URL',
      );
    });
  });

  describe('fetchCsvFromGoogleSheet', () => {
    it('should use unauthenticated fetch for public sheets', async () => {
      jest.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const { fetchWithProxy } = (await import('../src/fetch')) as any;
      jest.mocked(fetchWithProxy as any).mockResolvedValueOnce({
        status: 200,
        text: () => Promise.resolve('header1\nvalue1'),
      } as Response);

      const result = await fetchCsvFromGoogleSheet(
        'https://docs.google.com/spreadsheets/d/123/edit',
      );
      expect(result).toEqual([{ header1: 'value1' }]);
    });
  });

  describe('writeCsvToGoogleSheet', () => {
    const mockSheets = {
      spreadsheets: {
        values: {
          update: jest.fn(),
        },
      },
    } as any;

    beforeEach(() => {
      const { sheets } = require('@googleapis/sheets') as any;
      jest.mocked(sheets).mockReturnValue(mockSheets);
    });

    it('should write CSV data to sheet', async () => {
      const rows = [{ header1: 'value1', header2: 'value2' }];

      await writeCsvToGoogleSheet(rows, 'https://docs.google.com/spreadsheets/d/123/edit');

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: '123',
        range: 'A1:ZZZ',
        valueInputOption: 'USER_ENTERED',
        auth: expect.any(Object),
        requestBody: {
          values: [
            ['header1', 'header2'],
            ['value1', 'value2'],
          ],
        },
      });
    });

    it('should throw error for invalid URL', async () => {
      await expect(writeCsvToGoogleSheet([], 'invalid-url')).rejects.toThrow(
        'Invalid Google Sheets URL',
      );
    });
  });
});
