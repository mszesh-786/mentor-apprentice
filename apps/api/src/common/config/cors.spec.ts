import { parseCorsOrigins } from './cors';

describe('parseCorsOrigins', () => {
  it('defaults to the local web origin', () => {
    expect(parseCorsOrigins(undefined)).toBe('http://localhost:5173');
    expect(parseCorsOrigins(' , ')).toBe('http://localhost:5173');
  });

  it('returns a single origin as a string', () => {
    expect(parseCorsOrigins('https://app.example.com/')).toBe(
      'https://app.example.com',
    );
  });

  it('splits, trims and strips trailing slashes from a list', () => {
    expect(
      parseCorsOrigins(' https://app.example.com/ ,http://localhost:5173'),
    ).toEqual(['https://app.example.com', 'http://localhost:5173']);
  });
});
