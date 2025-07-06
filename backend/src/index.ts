import express from 'express';
import dotenv from 'dotenv';
import { checkJwt } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/protected', checkJwt, (req, res) => {
  console.log(req.headers);
  res.json({ message: 'You are authenticated!', user: req.auth });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
