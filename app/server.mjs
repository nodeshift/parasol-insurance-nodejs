import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyEnv from '@fastify/env';
import path from 'node:path';
import { fileURLToPath } from 'url';
import fs from 'node:fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import claimsRoute from './routes/claims-route.mjs';
import chatbotWSRoute from './routes/chatbot-ws-route.mjs';
import sqliteConnector from './plugins/db/sqlite-connector.mjs';

// Setup Logging
const fastify = Fastify({
  logger: true
});

// Register the Fastify ENV plugin for reading the .env files
await fastify.register(fastifyEnv, {
  schema: {
    type: 'object'
  },
  dotenv: true
});

// WebUI related setup and serving
const webuiLocation = './webui/dist';

fastify.register(fastifyStatic, {
  wildcard: false,
  root: path.join(__dirname, webuiLocation)
});

fastify.get('/*', (req, res) => {
  res.send(fs.createReadStream(path.join(__dirname, webuiLocation, 'index.html')));
});

// Register plugins and Routes
fastify.register(sqliteConnector);
fastify.register(fastifyWebsocket);

fastify.register(claimsRoute);
fastify.register(chatbotWSRoute);

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 8080, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
};
start();
