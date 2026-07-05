import mongoose from 'mongoose';

export const connectDB = async () => {
  const connUri = process.env.DATABASE_URL;
  if (!connUri) {
    console.error('[db]: DATABASE_URL is not defined in the environment variables');
    process.exit(1);
  }

  let attempts = 5;
  while (attempts > 0) {
    try {
      const conn = await mongoose.connect(connUri);
      console.log(`[db]: MongoDB connected successfully to host: ${conn.connection.host}`);
      return;
    } catch (err) {
      attempts--;
      console.error(`[db]: MongoDB connection error (attempts remaining: ${attempts}):`);
      console.error(err);
      if (attempts === 0) {
        process.exit(1);
      }
      // Wait 5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
