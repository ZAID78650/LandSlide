import { createServer } from 'vite';

const server = await createServer({
  configFile: './vite.config.js',
});
await server.listen(5173, '0.0.0.0');
server.printUrls();
console.log('VITE_READY_ON_5173');

// Keep process alive
setInterval(() => {}, 30000);
