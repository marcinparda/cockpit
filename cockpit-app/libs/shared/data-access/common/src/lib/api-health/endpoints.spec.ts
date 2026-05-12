import { describe, it, expect } from 'vitest';
import { HEALTH_ENDPOINTS } from './endpoints';

describe('HEALTH_ENDPOINTS', () => {
  it('returns correct health path', () => {
    expect(HEALTH_ENDPOINTS.health()).toBe('/health');
  });

  it('returns correct cleanupHealth path', () => {
    expect(HEALTH_ENDPOINTS.cleanupHealth()).toBe('/health/cleanup');
  });

  it('returns correct root path', () => {
    expect(HEALTH_ENDPOINTS.root()).toBe('/');
  });
});
