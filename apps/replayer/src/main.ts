import express from 'express';

import { withdraw } from '@mixer/offchain';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.post('/withdraw', async (req, res) => {
  const txHash = withdraw();
  res.send({ message: 'Hello API' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
