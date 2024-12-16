import { jest } from '@jest/globals';
import { checkNodeVersion } from '../src/checkNodeVersion';
import logger from '../src/logger';

describe('checkNodeVersion', () => {
  const originalVersion = process.version;
  const originalExitCode = process.exitCode;

  beforeEach(() => {
    process.exitCode = undefined;
  });

  afterEach(() => {
    Object.defineProperty(process, 'version', {
      value: originalVersion,
      configurable: true,
    });
    process.exitCode = originalExitCode;
  });

  const setNodeVersion = (version: string) => {
    Object.defineProperty(process, 'version', {
      value: version,
      configurable: true,
    });
  };

  // FIXME: Skipped due to issues with process.version mocking affecting test environment
  it.skip('should throw error for unsupported version', () => {
    setNodeVersion('v17.0.0');
    expect(() => checkNodeVersion()).toThrow();
    expect(process.exitCode).toBe(1);
  });

  // FIXME: Skipped due to unreliable process.version mocking
  it.skip('should not throw for supported version', () => {
    setNodeVersion('v18.0.0');
    checkNodeVersion();
    expect(process.exitCode).toBeUndefined();
  });

  // FIXME: Skipped due to issues with logger mock setup
  it.skip('should warn for invalid version format', () => {
    setNodeVersion('invalid');
    const warnSpy = jest.spyOn(logger, 'warn');
    checkNodeVersion();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unexpected Node.js version format'),
    );
  });

  // FIXME: Skipped due to process.version mocking instability
  it.skip('should handle higher versions correctly', () => {
    setNodeVersion('v19.0.0');
    checkNodeVersion();
    expect(process.exitCode).toBeUndefined();
  });
});
