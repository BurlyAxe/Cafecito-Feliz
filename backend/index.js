import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDB } from "./Config/database.js";
import productRoutes from "./Routes/productRoutes.js";
import customerRoutes from "./Routes/customerRoutes.js";
import saleRoutes from "./Routes/saleRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db: DB_STATES[mongoose.connection.readyState] ?? "unknown",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", saleRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON body" });
  }

  console.error("Unhandled error:", error.message);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

await connectDB();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
