import { getCurrentTimestamp, sleep } from '../src/util/time';

describe('getCurrentTimestamp', () => {
  it('should return a timestamp in seconds', () => {
    const timestamp = getCurrentTimestamp();
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);

    expect(timestamp).toBeGreaterThanOrEqual(currentTimeInSeconds - 1);
    expect(timestamp).toBeLessThanOrEqual(currentTimeInSeconds + 1);
  });
});

describe('sleep', () => {
  it('should sleep for the specified duration', async () => {
    const startTime = Date.now();
    const sleepDuration = 100;

    await sleep(sleepDuration);

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    expect(elapsedTime).toBeGreaterThanOrEqual(sleepDuration);
    expect(elapsedTime).toBeLessThanOrEqual(sleepDuration + 50); // Allow small buffer for timing variations
  });

  it('should resolve the promise after sleeping', async () => {
    const promise = sleep(50);
    expect(promise).toBeInstanceOf(Promise);
    await expect(promise).resolves.toBeUndefined();
  });
});
