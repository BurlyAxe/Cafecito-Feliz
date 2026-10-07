import mongoose from "mongoose";
import Sale from "../Models/Sale.js";
import SaleItem from "../Models/SaleItem.js";
import { SaleError, quoteCart, registerSale } from "../Services/saleService.js";

const isInvalidId = (id) => !mongoose.Types.ObjectId.isValid(id);

const handledSaleError = (res, error) => {
    if (!(error instanceof SaleError)) return false;

    const body = { message: error.message };

    if (error.errors.length > 0) {
        body.errors = error.errors;
    }

    res.status(error.status).json(body);
    return true;
};

export const previewCart = async (req, res) => {
    try {
        const cart = await quoteCart(req.body ?? {});

        res.json({ data: cart });
    } catch (error) {
        if (handledSaleError(res, error)) return;

        console.error("Error in previewCart:", error.message);
        res.status(500).json({ message: "Failed to calculate the cart" });
    }
};

export const createSale = async (req, res) => {
    try {
        const sale = await registerSale(req.body ?? {});

        res.status(201).json({
            message: "Sale registered",
            data: sale,
        });
    } catch (error) {
        if (handledSaleError(res, error)) return;

        console.error("Error in createSale:", error.message);
        res.status(500).json({ message: "Failed to register the sale" });
    }
};

export const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid sale ID" });
        }

        const sale = await Sale.findById(id)
            .populate("customerId", "name email phone")
            .lean();

        if (!sale) {
            return res.status(404).json({ message: "Sale not found" });
        }

        const items = await SaleItem.find({ saleId: sale._id })
            .sort({ createdAt: 1, _id: 1 })
            .lean();

        res.json({ data: { ...sale, items } });
    } catch (error) {
        console.error("Error in getSaleById:", error.message);
        res.status(500).json({ message: "Failed to fetch the sale" });
    }
};
