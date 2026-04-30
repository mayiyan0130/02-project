import 'dotenv/config';
import { buildApp } from './app';
import { readEnv } from './config/env';

const start = async () => {
  const env = readEnv();
  const app = await buildApp(env);
  await app.listen({ port: env.port, host: '0.0.0.0' });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
