'use strict';

const { spawn } = require('child_process');
const path = require('path');

const projectRoot = __dirname;

const bots = [
  {
    name: 'secondary',
    configFile: 'settings-server2.json',
    port: '5011',
  },
  {
    name: 'main',
    configFile: 'settings.json',
    port: '5010',
  },
];

const restartState = new Map();

function getRestartDelay(name) {
  const entry = restartState.get(name) || { attempts: 0 };
  const delay = Math.min(10000 + entry.attempts * 5000, 60000);
  entry.attempts += 1;
  restartState.set(name, entry);
  return delay;
}

function resetRestartBackoff(name) {
  restartState.set(name, { attempts: 0 });
}

function startBot(entry) {
  const child = spawn(process.execPath, ['index.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      CONFIG_FILE: entry.configFile,
      PORT: entry.port,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  const prefix = `[${entry.name}] `;

  // If process survives for a while, reset restart backoff.
  const stableTimer = setTimeout(() => {
    resetRestartBackoff(entry.name);
  }, 120000);

  child.stdout.on('data', (data) => {
    process.stdout.write(String(data).split(/\r?\n/).map((line) => line ? prefix + line : line).join('\n') + '\n');
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(String(data).split(/\r?\n/).map((line) => line ? prefix + line : line).join('\n') + '\n');
  });

  child.on('exit', (code, signal) => {
    clearTimeout(stableTimer);
    console.log(`${prefix}exited with code ${code ?? 'null'}${signal ? ` signal ${signal}` : ''}`);

    const delay = getRestartDelay(entry.name);
    console.log(`${prefix}restarting in ${Math.floor(delay / 1000)}s...`);
    setTimeout(() => startBot(entry), delay);
  });

  return child;
}

console.log('Starting two bot instances...');
bots.forEach(startBot);