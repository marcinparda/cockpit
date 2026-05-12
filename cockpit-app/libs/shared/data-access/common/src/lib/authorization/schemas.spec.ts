import {
  roleSchema,
  rolesResponseSchema,
  actionSchema,
  featureSchema,
  permissionSchema,
  permissionsResponseSchema,
} from './schemas';

const validRole = { name: 'admin', id: '1' };
const validAction = { name: 'read', id: 'a1' };
const validFeature = { name: 'tasks', id: 'f1' };
const validPermission = { feature_id: 'f1', action_id: 'a1', id: 'p1' };

describe('authorization schemas', () => {
  it('validates roleSchema with valid input', () => {
    expect(roleSchema.parse(validRole)).toEqual(validRole);
  });

  it('validates rolesResponseSchema with array of roles', () => {
    expect(rolesResponseSchema.parse([validRole])).toEqual([validRole]);
  });

  it('validates permissionSchema with valid input', () => {
    expect(permissionSchema.parse(validPermission)).toEqual(validPermission);
  });

  it('validates permissionsResponseSchema with array of permissions', () => {
    expect(permissionsResponseSchema.parse([validPermission])).toEqual([
      validPermission,
    ]);
  });

  it('throws on invalid roleSchema input', () => {
    expect(() => roleSchema.parse({ name: 'admin' })).toThrow();
  });

  it('throws on invalid permissionSchema input', () => {
    expect(() => permissionSchema.parse({ feature_id: 'f1' })).toThrow();
  });

  it('validates actionSchema and featureSchema', () => {
    expect(actionSchema.parse(validAction)).toEqual(validAction);
    expect(featureSchema.parse(validFeature)).toEqual(validFeature);
  });
});
