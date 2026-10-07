import mongoose from "mongoose";
import Product from "../Models/Product.js";
import { ROLES, getRole } from "../Middlewares/requireRole.js";

const isInvalidId = (id) => !mongoose.Types.ObjectId.isValid(id);

const isStaff = (req) => [ROLES.SELLER, ROLES.ADMIN].includes(getRole(req));

const handledClientError = (res, error) => {
    if (error.name === "ValidationError") {
        res.status(400).json({
            message: "Invalid data",
            errors: Object.values(error.errors).map((e) => e.message),
        });
        return true;
    }

    if (error.code === 11000) {
        res.status(409).json({ message: "The product already exists" });
        return true;
    }

    return false;
};

export const getProducts = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10, includeOutOfStock } = req.query;

        const pageNumber = Math.max(Number(page) || 1, 1);
        const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);
        const showAll = includeOutOfStock === "true" && isStaff(req);

        const filter = {};

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        if (!showAll) {
            filter.stock = { $gt: 0 };
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort({ createdAt: -1 })
                .skip((pageNumber - 1) * perPage)
                .limit(perPage),
            Product.countDocuments(filter),
        ]);

        res.json({
            data: products,
            meta: {
                total,
                page: pageNumber,
                limit: perPage,
                totalPages: Math.ceil(total / perPage),
            },
        });
    } catch (error) {
        console.error("Error in getProducts:", error.message);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ data: product });
    } catch (error) {
        console.error("Error in getProductById:", error.message);
        res.status(500).json({ message: "Failed to fetch the product" });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, price, stock } = req.body ?? {};

        const product = await Product.create({ name, price, stock });

        res.status(201).json({
            message: "Product created",
            data: product,
        });
    } catch (error) {
        if (handledClientError(res, error)) return;

        console.error("Error in createProduct:", error.message);
        res.status(500).json({ message: "Failed to create the product" });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const { name, price } = req.body ?? {};

        const product = await Product.findByIdAndUpdate(
            id,
            { name, price },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({
            message: "Product updated",
            data: product,
        });
    } catch (error) {
        if (handledClientError(res, error)) return;

        console.error("Error in updateProduct:", error.message);
        res.status(500).json({ message: "Failed to update the product" });
    }
};

export const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const { delta } = req.body ?? {};

        if (!Number.isSafeInteger(delta) || delta === 0) {
            return res.status(400).json({
                message: "Invalid data",
                errors: ["delta must be a non-zero integer"],
            });
        }

        const filter = delta < 0
            ? { _id: id, stock: { $gte: -delta } }
            : { _id: id };

        const product = await Product.findOneAndUpdate(
            filter,
            { $inc: { stock: delta } },
            { returnDocument: "after" }
        );

        if (product) {
            return res.json({
                message: "Stock updated",
                data: product,
            });
        }

        const current = await Product.findById(id).select("stock");

        if (!current) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(409).json({
            message: "Insufficient stock",
            errors: [`Cannot remove ${-delta} units: only ${current.stock} available`],
        });
    } catch (error) {
        console.error("Error in adjustStock:", error.message);
        res.status(500).json({ message: "Failed to adjust the stock" });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        if (getRole(req) === ROLES.ADMIN) {
            const product = await Product.findByIdAndDelete(id);

            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            return res.json({
                message: "Product deleted",
                data: product,
            });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { stock: 0 },
            { returnDocument: "after" }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({
            message: "Product removed from the catalog",
            data: product,
        });
    } catch (error) {
        console.error("Error in deleteProduct:", error.message);
        res.status(500).json({ message: "Failed to delete the product" });
    }
};
