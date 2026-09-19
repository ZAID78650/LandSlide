const { createServer } = require('vite');
createServer({ configFile: './vite.config.js' }).then(async (server) => {
  await server.listen(5173, '0.0.0.0');
  server.printUrls();
  console.log('VITE_READY_ON_5173');
}).catch((e) => { console.error(e.message); process.exit(1); });
