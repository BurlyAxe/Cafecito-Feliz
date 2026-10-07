import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.DB_CONNECTION_STRING;

  if (!uri) {
    console.error("❌ Missing DB_CONNECTION_STRING in the .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};
