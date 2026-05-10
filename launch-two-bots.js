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

  child.stdout.on('data', (data) => {
    process.stdout.write(String(data).split(/\r?\n/).map((line) => line ? prefix + line : line).join('\n') + '\n');
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(String(data).split(/\r?\n/).map((line) => line ? prefix + line : line).join('\n') + '\n');
  });

  child.on('exit', (code, signal) => {
    console.log(`${prefix}exited with code ${code ?? 'null'}${signal ? ` signal ${signal}` : ''}`);
  });

  return child;
}

console.log('Starting two bot instances...');
bots.forEach(startBot);