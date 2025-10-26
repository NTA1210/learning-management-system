// src/setupTests.ts
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";
process.env.DOTENV_CONFIG_SILENT = "true";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

beforeEach(async () => {
  // Reset DB trước mỗi test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterEach(() => {
  jest.clearAllMocks(); // Reset mock function
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});
