import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDB } from "./Config/database.js";

const app = express();

app.use(cors());
app.use(express.json());

const ESTADOS_DB = ["desconectada", "conectada", "conectando", "desconectando"];

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db: ESTADOS_DB[mongoose.connection.readyState] ?? "desconocido",
  });
});

const PORT = process.env.PORT || 3000;

await connectDB();

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
