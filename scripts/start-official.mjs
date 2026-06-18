import { spawn } from 'node:child_process';

function startProcess(label, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
}

const proxy = startProcess('proxy', process.execPath, ['./scripts/api-bible-proxy.mjs']);
const app = startProcess('app', process.execPath, ['./scripts/dev-server.mjs']);

function shutdown() {
  proxy.kill();
  app.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
