# Genetic Algorithm TSP Solver

A from-scratch genetic algorithm for the Traveling Salesman Problem (TSP), written in plain JavaScript with zero dependencies. It includes a live browser visualization of the population evolving a route in real time, and a Node CLI that benchmarks the GA against a nearest-neighbor baseline.

## Why

TSP is NP-hard: for `n` cities there are `(n-1)!/2` distinct tours, so exact search is only practical for tiny instances. A genetic algorithm treats each candidate tour as an individual, evolves a population of them across generations using selection, crossover, and mutation, and converges on short (though not guaranteed optimal) routes in a fraction of the time brute force would take. This project exists to show that process end to end, not just call a library: every operator is implemented from scratch and is unit tested.

## What it does

- **Population**: each individual is a permutation of city indices (a candidate tour).
- **Fitness**: `1 / tourDistance`, so shorter tours score higher.
- **Selection**: tournament selection — sample `k` individuals, keep the fittest.
- **Crossover**: order crossover (OX1) — copy a random slice from parent A, then fill the rest with parent B's genes in order, skipping duplicates. This always yields a valid permutation, which is why it's the standard crossover for permutation problems like TSP.
- **Mutation**: swap mutation — with probability `mutationRate`, swap a city with a random other position.
- **Elitism**: the top `eliteCount` tours are copied unchanged into the next generation so the GA never loses its best-found solution.

## How to run

Requires Node 18+. No install step — there are no runtime dependencies.

**Run the tests:**

```
npm test
```

**Run the benchmark CLI** (random cities, GA vs. nearest-neighbor baseline):

```
npm run benchmark
# or with custom parameters:
node src/cli.js --cities 60 --population 150 --generations 500 --mutationRate 0.02 --seed 1
```

Example output:

```
Nearest-neighbor baseline distance: 4887.27
gen    0  best=12044.10
gen   50  best=5432.93
gen  100  best=4741.96
gen  150  best=4559.49
GA best distance: 4559.49
Improvement over nearest-neighbor: 6.7%
```

**Run the interactive browser demo:**

The demo uses native ES modules, which most browsers block from `file://` due to CORS. Serve the folder locally instead:

```
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL and go to `index.html`. You can tune city count, population size, and mutation rate live, and watch the best route and the fitness-over-time chart update every generation.

## Design decisions

- **Order crossover over single-point crossover**: a naive single-point crossover on a permutation produces invalid tours (duplicate/missing cities) that then need repair. OX1 guarantees validity by construction, which keeps the rest of the algorithm simple.
- **Tournament selection over roulette wheel**: tournament selection doesn't require normalizing fitness values or handling negative/zero fitness edge cases, and it's easy to tune selection pressure via `tournamentSize`.
- **Elitism**: without it, the best tour found can be lost to crossover/mutation noise between generations; a small elite count (2) fixes that at negligible cost to diversity.
- **Seeded RNG (`mulberry32`)**: the CLI and tests take an injectable RNG so runs are reproducible — useful both for the benchmark (`--seed`) and for writing non-flaky tests. The browser demo uses `Math.random` since each run is meant to be a fresh, unpredictable instance.

## Testing

`test/ga.test.js` uses Node's built-in `node:test` runner (no test framework dependency) and covers:

- Distance and tour-length math on known geometry (unit square).
- That `orderCrossover` and `swapMutate` always produce valid permutations (no duplicate or missing cities), including at mutation rate 1.0.
- That the nearest-neighbor baseline visits every city exactly once.
- That fitness correctly ranks a shorter tour above a longer, self-intersecting one.
- That `evolve` preserves population size and carries the elite forward.
- An end-to-end sanity check that running the GA for 120 generations improves the best distance by at least 5% over the first generation's best, using a fixed seed so the test isn't flaky.

## Project structure

```
src/
  tsp.js    city generation, distance, tour length, nearest-neighbor baseline
  ga.js     population init, fitness, selection, crossover, mutation, evolve/run
  rng.js    seeded PRNG (mulberry32) for reproducible runs
  cli.js    Node benchmark CLI
test/
  ga.test.js
index.html  browser demo shell
demo.js     canvas rendering + GA loop for the browser demo
```
