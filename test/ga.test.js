import test from 'node:test';
import assert from 'node:assert/strict';
import { randomCities, distance, tourDistance, nearestNeighborTour } from '../src/tsp.js';
import {
  randomPermutation,
  orderCrossover,
  swapMutate,
  fitness,
  evolve,
  initPopulation,
  run,
} from '../src/ga.js';
import { mulberry32 } from '../src/rng.js';

test('distance computes Euclidean distance', () => {
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('tourDistance sums a closed loop', () => {
  const cities = [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0 },
  ];
  assert.equal(tourDistance([0, 1, 2, 3], cities), 4); // unit square perimeter
});

test('randomPermutation produces a valid permutation', () => {
  const rng = mulberry32(1);
  const perm = randomPermutation(10, rng);
  assert.equal(perm.length, 10);
  assert.deepEqual(
    [...perm].sort((a, b) => a - b),
    Array.from({ length: 10 }, (_, i) => i)
  );
});

test('orderCrossover child is a valid permutation containing every gene exactly once', () => {
  const rng = mulberry32(2);
  const a = randomPermutation(12, rng);
  const b = randomPermutation(12, rng);
  const child = orderCrossover(a, b, rng);
  assert.equal(child.length, 12);
  assert.deepEqual(
    [...child].sort((x, y) => x - y),
    Array.from({ length: 12 }, (_, i) => i)
  );
});

test('swapMutate preserves permutation validity even at mutation rate 1.0', () => {
  const rng = mulberry32(3);
  const tour = randomPermutation(8, rng);
  const mutated = swapMutate(tour, 1.0, rng);
  assert.deepEqual(
    [...mutated].sort((x, y) => x - y),
    Array.from({ length: 8 }, (_, i) => i)
  );
});

test('nearestNeighborTour visits every city exactly once', () => {
  const rng = mulberry32(4);
  const cities = randomCities(15, rng);
  const tour = nearestNeighborTour(cities);
  assert.deepEqual(
    [...tour].sort((x, y) => x - y),
    Array.from({ length: 15 }, (_, i) => i)
  );
});

test('fitness is inversely related to tour distance', () => {
  const cities = [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0 },
  ];
  const shortTour = [0, 1, 2, 3]; // perimeter, no crossing
  const longTour = [0, 2, 1, 3]; // crosses the square diagonally, longer
  assert.ok(fitness(shortTour, cities) > fitness(longTour, cities));
});

test('evolve returns a same-size population and carries elites over', () => {
  const rng = mulberry32(5);
  const cities = randomCities(10, rng);
  const population = initPopulation(20, 10, rng);
  const { population: next, best, bestDistance } = evolve(population, cities, {
    eliteCount: 2,
    rng,
  });
  assert.equal(next.length, 20);
  assert.ok(bestDistance > 0);
  assert.equal(best.length, 10);
});

test('run improves the best distance over generations', () => {
  const rng = mulberry32(7);
  const cities = randomCities(20, rng);
  const { history, bestDistance } = run(cities, {
    populationSize: 60,
    generations: 120,
    mutationRate: 0.03,
    rng,
  });
  assert.equal(history.length, 120);
  assert.ok(bestDistance <= history[0]);
  // The GA should meaningfully beat the very first generation's best tour.
  assert.ok(bestDistance < history[0] * 0.95);
});
