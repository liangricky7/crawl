// run: node --test src/geo.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inside } from './geo.ts';

const sq = [[0, 0], [0, 1], [1, 1], [1, 0]].map(([latitude, longitude]) => ({ latitude, longitude }));

test('point in polygon', () => {
  assert.equal(inside({ latitude: 0.5, longitude: 0.5 }, sq), true);
  assert.equal(inside({ latitude: 1.5, longitude: 0.5 }, sq), false);
  assert.equal(inside({ latitude: 0.5, longitude: -0.1 }, sq), false);
});
