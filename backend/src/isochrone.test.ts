import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeMapBody } from './isochrone';

const o = { lat: 30.41, lng: -91.18 };
const ids = (b: any) => b.departure_searches.map((s: any) => s.id);

test('single mode: one search, no union', () => {
  const b: any = buildTimeMapBody(o, 15, ['car']);
  assert.deepEqual(ids(b), ['car']);
  assert.equal(b.departure_searches[0].travel_time, 900);
  assert.equal(b.departure_searches[0].transportation.type, 'driving');
  assert.equal(b.unions, undefined);
});

test('walk + bus collapses to transit only', () => {
  const b: any = buildTimeMapBody(o, 15, ['walk', 'bus']);
  assert.deepEqual(ids(b), ['bus']);
  assert.equal(b.unions, undefined);
});

test('multiple modes produce a union', () => {
  const b: any = buildTimeMapBody(o, 10, ['walk', 'car', 'car']);
  assert.deepEqual(ids(b), ['walk', 'car']);
  assert.deepEqual(b.unions, [{ id: 'union', search_ids: ['walk', 'car'] }]);
});
