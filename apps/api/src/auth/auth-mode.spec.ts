import { assertSafeAuthMode } from './auth-mode';

describe('assertSafeAuthMode', () => {
  it('rejects stub auth in production', () => {
    expect(() => assertSafeAuthMode({ NODE_ENV: 'production' })).toThrow(
      /not allowed/,
    );
    expect(() =>
      assertSafeAuthMode({ NODE_ENV: 'production', AUTH_MODE: 'stub' }),
    ).toThrow(/not allowed/);
  });

  it('allows auth0 in production', () => {
    expect(() =>
      assertSafeAuthMode({ NODE_ENV: 'production', AUTH_MODE: 'auth0' }),
    ).not.toThrow();
  });

  it('allows stub outside production or with explicit opt-in', () => {
    expect(() => assertSafeAuthMode({ NODE_ENV: 'test' })).not.toThrow();
    expect(() =>
      assertSafeAuthMode({ NODE_ENV: 'production', ALLOW_STUB_AUTH: 'true' }),
    ).not.toThrow();
  });
});
