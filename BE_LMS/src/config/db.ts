import mongoose from "mongoose";
import { MONGO_URI } from "../constants/env";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database", MONGO_URI);
  } catch (error) {
    console.log("Could not connect to database", MONGO_URI);
    process.exit(1);
    //shutdown server if connection fails
  }
};

export default connectToDatabase;
