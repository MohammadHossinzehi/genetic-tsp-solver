#!/usr/bin/env node
// Node CLI: generates a random TSP instance, runs the nearest-neighbor
// baseline and the genetic algorithm against it, and prints a comparison.
//
// Usage:
//   node src/cli.js --cities 50 --population 150 --generations 400 --mutationRate 0.02 --seed 42

import { randomCities, nearestNeighborTour, tourDistance } from './tsp.js';
import { run } from './ga.js';
import { mulberry32 } from './rng.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { cities: 50, population: 150, generations: 400, mutationRate: 0.02, seed: 42 };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (key && key in opts) opts[key] = Number(value);
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  const rng = mulberry32(opts.seed);
  const cities = randomCities(opts.cities, rng);

  console.log('Genetic Algorithm TSP Solver');
  console.log(
    `cities=${opts.cities} population=${opts.population} generations=${opts.generations} ` +
      `mutationRate=${opts.mutationRate} seed=${opts.seed}`
  );
  console.log('');

  const nnTour = nearestNeighborTour(cities);
  const nnDistance = tourDistance(nnTour, cities);
  console.log(`Nearest-neighbor baseline distance: ${nnDistance.toFixed(2)}`);
  console.log('');

  const start = Date.now();
  const { bestDistance } = run(
    cities,
    {
      populationSize: opts.population,
      generations: opts.generations,
      mutationRate: opts.mutationRate,
      rng,
    },
    (gen, _best, dist) => {
      if (gen % 50 === 0 || gen === opts.generations - 1) {
        console.log(`gen ${String(gen).padStart(4, ' ')}  best=${dist.toFixed(2)}`);
      }
    }
  );
  const elapsed = Date.now() - start;

  const improvement = 100 * (1 - bestDistance / nnDistance);

  console.log('');
  console.log(`GA best distance: ${bestDistance.toFixed(2)}`);
  console.log(`Improvement over nearest-neighbor: ${improvement.toFixed(1)}%`);
  console.log(`Elapsed: ${elapsed}ms`);
}

main();
