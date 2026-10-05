import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.DB_CONNECTION_STRING;

  if (!uri) {
    console.error("❌ Falta DB_CONNECTION_STRING en el archivo .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB conectado");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error.message);
    process.exit(1);
  }
};
