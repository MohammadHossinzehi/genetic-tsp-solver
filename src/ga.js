// Core genetic algorithm: population init, fitness, tournament selection,
// order crossover (OX1), swap mutation, and the per-generation evolve step.
// Written from scratch with no dependencies.

import { tourDistance } from './tsp.js';

export function randomPermutation(n, rng = Math.random) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function initPopulation(size, numCities, rng = Math.random) {
  return Array.from({ length: size }, () => randomPermutation(numCities, rng));
}

// Fitness is the inverse of tour distance so that shorter tours score higher.
export function fitness(tour, cities) {
  return 1 / (tourDistance(tour, cities) + 1e-9);
}

export function tournamentSelect(population, fitnesses, k, rng = Math.random) {
  let bestIdx = Math.floor(rng() * population.length);
  let bestFit = fitnesses[bestIdx];
  for (let i = 1; i < k; i++) {
    const idx = Math.floor(rng() * population.length);
    if (fitnesses[idx] > bestFit) {
      bestFit = fitnesses[idx];
      bestIdx = idx;
    }
  }
  return population[bestIdx];
}

// Order Crossover (OX1): copy a random slice from parent A verbatim, then
// fill the remaining positions with parent B's genes in the order they
// appear, skipping anything already copied. Always produces a valid
// permutation, which is why it is the standard crossover for TSP-style GAs.
export function orderCrossover(parentA, parentB, rng = Math.random) {
  const n = parentA.length;
  const start = Math.floor(rng() * n);
  const end = Math.floor(rng() * n);
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);

  const child = new Array(n).fill(-1);
  const inChild = new Set();
  for (let i = lo; i <= hi; i++) {
    child[i] = parentA[i];
    inChild.add(parentA[i]);
  }

  let pointer = (hi + 1) % n;
  for (let i = 0; i < n; i++) {
    const idx = (hi + 1 + i) % n;
    const gene = parentB[idx];
    if (!inChild.has(gene)) {
      child[pointer] = gene;
      inChild.add(gene);
      pointer = (pointer + 1) % n;
    }
  }

  return child;
}

export function swapMutate(tour, mutationRate, rng = Math.random) {
  const mutated = tour.slice();
  for (let i = 0; i < mutated.length; i++) {
    if (rng() < mutationRate) {
      const j = Math.floor(rng() * mutated.length);
      [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    }
  }
  return mutated;
}

// Advance one generation: keep the top `eliteCount` tours unchanged, and
// fill the rest of the next generation with children of tournament-selected
// parents.
export function evolve(
  population,
  cities,
  { eliteCount = 2, tournamentSize = 5, mutationRate = 0.02, rng = Math.random } = {}
) {
  const fitnesses = population.map((t) => fitness(t, cities));
  const ranked = population
    .map((tour, i) => ({ tour, fit: fitnesses[i] }))
    .sort((a, b) => b.fit - a.fit);

  const nextGen = ranked.slice(0, eliteCount).map((r) => r.tour.slice());

  while (nextGen.length < population.length) {
    const parentA = tournamentSelect(population, fitnesses, tournamentSize, rng);
    const parentB = tournamentSelect(population, fitnesses, tournamentSize, rng);
    let child = orderCrossover(parentA, parentB, rng);
    child = swapMutate(child, mutationRate, rng);
    nextGen.push(child);
  }

  return {
    population: nextGen,
    best: ranked[0].tour,
    bestDistance: tourDistance(ranked[0].tour, cities),
  };
}

// Run the GA for a fixed number of generations, tracking the best distance
// seen so far. `onGeneration(gen, best, bestDistance)` is called after each
// generation if provided, which the CLI and the browser demo both use.
export function run(cities, options = {}, onGeneration) {
  const { populationSize = 100, generations = 300, rng = Math.random, ...evolveOpts } = options;

  let population = initPopulation(populationSize, cities.length, rng);
  let best = population[0];
  let bestDistance = tourDistance(best, cities);
  const history = [];

  for (let gen = 0; gen < generations; gen++) {
    const result = evolve(population, cities, { ...evolveOpts, rng });
    population = result.population;
    if (result.bestDistance < bestDistance) {
      bestDistance = result.bestDistance;
      best = result.best;
    }
    history.push(bestDistance);
    if (onGeneration) onGeneration(gen, best, bestDistance);
  }

  return { best, bestDistance, history };
}
