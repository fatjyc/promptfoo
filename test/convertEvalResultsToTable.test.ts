import { describe, it, expect } from '@jest/globals';
import { convertResultsToTable } from '../src/util/convertEvalResultsToTable';

describe('convertResultsToTable', () => {
  it('should convert results to table format', () => {
    const input: any = {
      version: 4,
      createdAt: new Date().toISOString(),
      config: {},
      author: 'test',
      prompts: [
        {
          raw: 'Test prompt 1',
          display: 'Test prompt 1',
          label: 'Test Label 1',
          provider: 'test-provider',
        },
        {
          raw: 'Test prompt 2',
          display: 'Test prompt 2',
          label: 'Test Label 2',
          provider: 'test-provider',
        },
      ],
      results: {
        version: 2,
        timestamp: new Date().toISOString(),
        stats: {},
        table: [],
        results: [
          {
            id: 'test1',
            promptId: 'prompt1',
            testIdx: 0,
            promptIdx: 0,
            vars: {
              var1: 'value1',
              var2: 'value2',
            },
            success: true,
            score: 1,
            response: {
              output: 'Test output 1',
              tokenUsage: {
                total: 10,
                prompt: 5,
                completion: 5,
                cached: 0,
              },
            },
            provider: {
              id: 'test-provider',
              label: 'Test Provider',
            },
            prompt: {
              raw: 'Test prompt 1',
              display: 'Test prompt 1',
              label: 'Test Label 1',
              provider: 'test-provider',
            },
            testCase: {
              assert: false,
            },
            latencyMs: 100,
            cost: 0.01,
            gradingResult: {
              componentResults: [{ pass: true, reason: 'test passed', score: 1 }],
            },
          },
          {
            id: 'test2',
            promptId: 'prompt2',
            testIdx: 0,
            promptIdx: 1,
            vars: {
              var1: 'value1',
              var2: 'value2',
            },
            success: false,
            score: 0,
            response: {
              output: 'Test output 2',
              tokenUsage: {
                total: 10,
                prompt: 5,
                completion: 5,
                cached: 0,
              },
            },
            provider: {
              id: 'test-provider',
              label: 'Test Provider',
            },
            prompt: {
              raw: 'Test prompt 2',
              display: 'Test prompt 2',
              label: 'Test Label 2',
              provider: 'test-provider',
            },
            testCase: {
              assert: false,
            },
            latencyMs: 100,
            cost: 0.01,
            gradingResult: {
              componentResults: [{ pass: false, reason: 'test failed', score: 0 }],
            },
          },
        ],
      },
    };

    const result = convertResultsToTable(input);

    expect(result).toMatchObject({
      head: {
        prompts: expect.arrayContaining([
          expect.objectContaining({
            raw: 'Test prompt 1',
            provider: 'Test Provider',
          }),
          expect.objectContaining({
            raw: 'Test prompt 2',
            provider: 'Test Provider',
          }),
        ]),
        vars: ['var1', 'var2'],
      },
      body: expect.arrayContaining([
        expect.objectContaining({
          vars: ['value1', 'value2'],
          outputs: expect.arrayContaining([
            expect.objectContaining({
              text: 'Test output 1',
              pass: true,
              provider: 'Test Provider',
            }),
            expect.objectContaining({
              text: expect.stringContaining('Test output 2'),
              pass: false,
              provider: 'Test Provider',
            }),
          ]),
        }),
      ]),
    });
  });

  it('should handle empty results', () => {
    const input: any = {
      version: 4,
      createdAt: new Date().toISOString(),
      config: {},
      author: 'test',
      prompts: [],
      results: {
        version: 2,
        timestamp: new Date().toISOString(),
        stats: {},
        table: [],
        results: [],
      },
    };

    const result = convertResultsToTable(input);

    expect(result).toEqual({
      head: {
        prompts: [],
        vars: [],
      },
      body: [],
    });
  });

  it('should throw error if prompts are missing', () => {
    const input: any = {
      version: 4,
      createdAt: new Date().toISOString(),
      config: {},
      author: 'test',
      results: {
        version: 2,
        timestamp: new Date().toISOString(),
        stats: {},
        table: [],
        results: [],
      },
    };

    expect(() => convertResultsToTable(input)).toThrow();
  });

  it('should handle results with no variables', () => {
    const input: any = {
      version: 4,
      createdAt: new Date().toISOString(),
      config: {},
      author: 'test',
      prompts: [
        {
          raw: 'Test prompt',
          display: 'Test prompt',
          label: 'Test Label',
          provider: 'test-provider',
        },
      ],
      results: {
        version: 2,
        timestamp: new Date().toISOString(),
        stats: {},
        table: [],
        results: [
          {
            id: 'test1',
            promptId: 'prompt1',
            testIdx: 0,
            promptIdx: 0,
            success: true,
            score: 1,
            response: {
              output: 'Test output',
            },
            provider: {
              id: 'test-provider',
              label: 'Test Provider',
            },
            prompt: {
              raw: 'Test prompt',
              display: 'Test prompt',
              label: 'Test Label',
              provider: 'test-provider',
            },
            testCase: {
              assert: false,
            },
          },
        ],
      },
    };

    const result = convertResultsToTable(input);

    expect(result.head.vars).toEqual([]);
    expect(result.body[0].vars).toEqual([]);
  });
});
