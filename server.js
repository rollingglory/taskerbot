'use strict';

const { name, version } = require('./package.json');
const app = require('./web');
const server = require('http').createServer(app);

server.listen(process.env.PORT, () => {
  const { address, port } = server.address();
  console.log(`${name}-${version} ${address}${port}`);
});
