// Problem definition helpers for the Traveling Salesman Problem: random city
// generation, Euclidean distance, total tour length, and a nearest-neighbor
// heuristic used as a baseline to measure the genetic algorithm against.

export function randomCities(n, rng = Math.random, width = 800, height = 600) {
  const cities = [];
  for (let i = 0; i < n; i++) {
    cities.push({ x: rng() * width, y: rng() * height });
  }
  return cities;
}

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Sum of edge lengths for a closed tour (returns to the first city at the end).
export function tourDistance(tour, cities) {
  let total = 0;
  for (let i = 0; i < tour.length; i++) {
    const from = cities[tour[i]];
    const to = cities[tour[(i + 1) % tour.length]];
    total += distance(from, to);
  }
  return total;
}

// Greedy baseline: always travel to the closest unvisited city.
export function nearestNeighborTour(cities, start = 0) {
  const n = cities.length;
  const visited = new Array(n).fill(false);
  const tour = [start];
  visited[start] = true;
  let current = start;

  for (let step = 1; step < n; step++) {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited[i]) {
        const d = distance(cities[current], cities[i]);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
    }
    tour.push(best);
    visited[best] = true;
    current = best;
  }

  return tour;
}
