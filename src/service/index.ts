import path from 'node:path';
import { createApp } from './app';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const rootPath = path.resolve(__dirname, '..', '..');
const app = createApp(rootPath);

app.listen(port, host, () => {
  console.log(`com.dajour is running at http://${host}:${port}`);
});
