import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('user key is a non-empty string', () => {
    expect(typeof queryKeys.user).toBe('string');
    expect(queryKeys.user.length).toBeGreaterThan(0);
  });

  it('userPermissions key is a non-empty string', () => {
    expect(typeof queryKeys.userPermissions).toBe('string');
    expect(queryKeys.userPermissions.length).toBeGreaterThan(0);
  });

  it('userRoles key is a non-empty string', () => {
    expect(typeof queryKeys.userRoles).toBe('string');
    expect(queryKeys.userRoles.length).toBeGreaterThan(0);
  });

  it('all keys are unique', () => {
    const values = Object.values(queryKeys);
    expect(new Set(values).size).toBe(values.length);
  });
});
