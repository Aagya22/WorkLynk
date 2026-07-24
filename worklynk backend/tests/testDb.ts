import mongoose from 'mongoose';

export async function connectTestDb(): Promise<void> {
  const uri = process.env.DATABASE_URL as string;
  await mongoose.connect(uri);
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

export async function clearTestDb(): Promise<void> {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}
