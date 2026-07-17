// Browser demo: drives the GA in real time and renders the city map plus a
// live fitness chart on two <canvas> elements. Pure DOM + canvas, no
// framework, no build step.

import { randomCities, tourDistance } from './src/tsp.js';
import { initPopulation, evolve } from './src/ga.js';

let cities = [];
let population = [];
let best = null;
let bestDistance = Infinity;
let generation = 0;
let running = false;
let history = [];

const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');
const chartCanvas = document.getElementById('chartCanvas');
const chartCtx = chartCanvas.getContext('2d');

const numCitiesInput = document.getElementById('numCities');
const popSizeInput = document.getElementById('popSize');
const mutRateInput = document.getElementById('mutRate');
const genCountEl = document.getElementById('genCount');
const bestDistEl = document.getElementById('bestDist');

function setup() {
  const n = Number(numCitiesInput.value);
  const popSize = Number(popSizeInput.value);
  const margin = 24;

  cities = randomCities(n, Math.random, mapCanvas.width - margin * 2, mapCanvas.height - margin * 2).map(
    (c) => ({ x: c.x + margin, y: c.y + margin })
  );
  population = initPopulation(popSize, n);
  best = population[0];
  bestDistance = tourDistance(best, cities);
  generation = 0;
  history = [];
  draw();
}

function step() {
  const mutationRate = Number(mutRateInput.value);
  const result = evolve(population, cities, { mutationRate, eliteCount: 2, tournamentSize: 5 });
  population = result.population;
  if (result.bestDistance < bestDistance) {
    bestDistance = result.bestDistance;
    best = result.best;
  }
  generation++;
  history.push(bestDistance);
  if (history.length > 500) history.shift();
  draw();
}

function draw() {
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

  if (best) {
    mapCtx.strokeStyle = '#e74c3c';
    mapCtx.lineWidth = 1.5;
    mapCtx.beginPath();
    best.forEach((cityIdx, i) => {
      const c = cities[cityIdx];
      if (i === 0) mapCtx.moveTo(c.x, c.y);
      else mapCtx.lineTo(c.x, c.y);
    });
    mapCtx.closePath();
    mapCtx.stroke();
  }

  mapCtx.fillStyle = '#4f8ef7';
  cities.forEach((c) => {
    mapCtx.beginPath();
    mapCtx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    mapCtx.fill();
  });

  chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  if (history.length > 1) {
    const max = Math.max(...history);
    const min = Math.min(...history);
    chartCtx.strokeStyle = '#2ecc71';
    chartCtx.lineWidth = 1.5;
    chartCtx.beginPath();
    history.forEach((d, i) => {
      const x = (i / (history.length - 1)) * chartCanvas.width;
      const y = chartCanvas.height - ((d - min) / (max - min + 1e-9)) * (chartCanvas.height - 10) - 5;
      if (i === 0) chartCtx.moveTo(x, y);
      else chartCtx.lineTo(x, y);
    });
    chartCtx.stroke();
  }

  genCountEl.textContent = String(generation);
  bestDistEl.textContent = bestDistance.toFixed(2);
}

function loop() {
  if (!running) return;
  step();
  requestAnimationFrame(loop);
}

document.getElementById('startBtn').addEventListener('click', () => {
  if (!running) {
    running = true;
    loop();
  }
});
document.getElementById('pauseBtn').addEventListener('click', () => {
  running = false;
});
document.getElementById('resetBtn').addEventListener('click', () => {
  running = false;
  setup();
});

setup();
