import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../Config/database.js";
import Product from "../Models/Product.js";
import Customer from "../Models/Customer.js";
import Sale from "../Models/Sale.js";
import SaleItem from "../Models/SaleItem.js";
import User from "../Models/User.js";
import { hashPassword } from "../Services/authService.js";

const users = [
  { username: "vendedor", name: "Vendedor", role: "seller", password: "cafecito123" },
  { username: "admin", name: "Administrador", role: "admin", password: "admin123" },
];

const products = [
  { category: "coffee", name: "Espresso", description: "Doble, 60 ml", price: 38, stock: 40 },
  { category: "coffee", name: "Americano", description: "12 oz", price: 42, stock: 36 },
  { category: "coffee", name: "Capuchino", description: "12 oz, espuma densa", price: 55, stock: 28 },
  { category: "coffee", name: "Latte", description: "12 oz", price: 58, stock: 30 },
  { category: "coffee", name: "Mocha", description: "Chocolate amargo", price: 62, stock: 18 },
  { category: "coffee", name: "Cold brew", description: "16 oz, 18 h de extracción", price: 65, stock: 12 },
  { category: "coffee", name: "Frappé de caramelo", description: "16 oz", price: 72, stock: 15 },
  { category: "tea", name: "Chai latte", description: "Especiado", price: 60, stock: 4 },
  { category: "tea", name: "Matcha helado", description: "16 oz", price: 68, stock: 0 },
  { category: "tea", name: "Té verde", description: "12 oz", price: 40, stock: 25 },
  { category: "tea", name: "Tisana de frutos rojos", description: "Sin cafeína", price: 45, stock: 20 },
  { category: "dessert", name: "Croissant", description: "De mantequilla", price: 45, stock: 14 },
  { category: "dessert", name: "Pan de elote", description: "Rebanada", price: 40, stock: 9 },
  { category: "dessert", name: "Muffin de arándano", description: "Horneado hoy", price: 42, stock: 3 },
  { category: "dessert", name: "Pastel de chocolate", description: "Rebanada", price: 65, stock: 6 },
  { category: "dessert", name: "Cheesecake de fresa", description: "Rebanada", price: 70, stock: 8 },
];

const customers = [
  { name: "María López", phone: "4491234567", email: "maria.lopez@correo.com", purchasesCount: 12 },
  { name: "Carlos Ruiz", phone: "4495550123", email: "carlos.ruiz@correo.com", purchasesCount: 3 },
  { name: "Ana Torres", phone: "4495550199", email: "ana.torres@correo.com", purchasesCount: 0 },
];

const seed = async () => {
  try {
    await connectDB();

    await Promise.all([
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Sale.deleteMany({}),
      SaleItem.deleteMany({}),
      User.deleteMany({}),
    ]);

    await Promise.all([User.init(), Customer.init(), Product.init()]);

    const usersWithHash = await Promise.all(
      users.map(async ({ password, ...user }) => ({
        ...user,
        passwordHash: await hashPassword(password),
      }))
    );

    await User.insertMany(usersWithHash);
    await Product.insertMany(products);
    await Customer.insertMany(customers);

    console.log(
      `Seed completed: ${users.length} users, ${products.length} products, ${customers.length} customers`
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error in seed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

await seed();
