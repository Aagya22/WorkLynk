import dotenv from 'dotenv';
import { connectDB } from './config/db';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 5001;

// Connect to MongoDB, then start listening.
connectDB();

app.listen(PORT, () => {
  console.log(`[server]: Secure backend is running on port ${PORT}`);
});
