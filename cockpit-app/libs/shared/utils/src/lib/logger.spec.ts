import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockMode = { value: 'development' };

vi.mock('./environments/environments', () => ({
  environments: {
    get mode() {
      return mockMode.value;
    },
  },
}));

import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockMode.value = 'development';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls console.log in development mode', () => {
    logger.debug('test');
    expect(console.log).toHaveBeenCalledWith('[DEBUG] test');
  });

  it('calls console.warn in development mode', () => {
    logger.warn('test');
    expect(console.warn).toHaveBeenCalledWith('[WARNING] test');
  });

  it('calls console.error in development mode', () => {
    logger.error('test');
    expect(console.error).toHaveBeenCalledWith('[ERROR] test');
  });

  it('does not call console.log in production mode', () => {
    mockMode.value = 'production';
    logger.debug('test');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('does not call console.warn in production mode', () => {
    mockMode.value = 'production';
    logger.warn('test');
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('does not call console.error in production mode', () => {
    mockMode.value = 'production';
    logger.error('test');
    expect(console.error).not.toHaveBeenCalled();
  });
});
