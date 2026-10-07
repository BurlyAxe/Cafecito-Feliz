import mongoose from 'mongoose';
import Customer from '../Models/Customer.js';
import Sale from '../Models/Sale.js';
import SaleItem from '../Models/SaleItem.js';

const isInvalidId = (id) => !mongoose.Types.ObjectId.isValid(id);

const handledClientError = (res, error) => {
    if (error.name === "ValidationError") {
        res.status(400).json({
            message: "Invalid data",
            errors: Object.values(error.errors).map((e) => e.message),
        });
        return true;
    }

    if (error.code === 11000) {
        res.status(409).json({ message: "A customer with that email already exists" });
        return true;
    }

    return false;
};

export const getCustomers = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;

        const pageNumber = Math.max(Number(page) || 1, 1);
        const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);

        const filter = {};

        if (search) {
            const regex = { $regex: search, $options: "i" };
            filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
        }

        const [customers, total] = await Promise.all([
            Customer.find(filter)
                .sort({ createdAt: -1 })
                .skip((pageNumber - 1) * perPage)
                .limit(perPage),
            Customer.countDocuments(filter),
        ]);

        res.json({
            data: customers,
            meta: {
                total,
                page: pageNumber,
                limit: perPage,
                totalPages: Math.ceil(total / perPage),
            },
        });
    } catch (error) {
        console.error("Error in getCustomers:", error.message);
        res.status(500).json({ message: "Failed to fetch customers" });
    }
};

export const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid customer ID" });
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.json({ data: customer });
    } catch (error) {
        console.error("Error in getCustomerById:", error.message);
        res.status(500).json({ message: "Failed to fetch the customer" });
    }
};

export const createCustomer = async (req, res) => {
    try {
        const { name, phone, email } = req.body ?? {};

        const customer = await Customer.create({ name, phone, email });

        res.status(201).json({
            message: "Customer created",
            data: customer,
        });
    } catch (error) {
        if (handledClientError(res, error)) return;

        console.error("Error in createCustomer:", error.message);
        res.status(500).json({ message: "Failed to create the customer" });
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid customer ID" });
        }

        const { name, phone, email } = req.body ?? {};

        const customer = await Customer.findByIdAndUpdate(
            id,
            { name, phone, email },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.json({
            message: "Customer updated",
            data: customer,
        });
    } catch (error) {
        if (handledClientError(res, error)) return;

        console.error("Error in updateCustomer:", error.message);
        res.status(500).json({ message: "Failed to update the customer" });
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid customer ID" });
        }

        if (await Sale.exists({ customerId: id })) {
            return res.status(409).json({ message: "Cannot delete a customer with registered sales" });
        }

        const customer = await Customer.findByIdAndDelete(id);

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.json({
            message: "Customer deleted",
            data: customer,
        });
    } catch (error) {
        console.error("Error in deleteCustomer:", error.message);
        res.status(500).json({ message: "Failed to delete the customer" });
    }
};

export const getCustomerPurchases = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid customer ID" });
        }

        if (!(await Customer.exists({ _id: id }))) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const sales = await Sale.find({ customerId: id })
            .sort({ createdAt: -1 })
            .lean();

        const items = await SaleItem.find({ saleId: { $in: sales.map((sale) => sale._id) } })
            .sort({ createdAt: 1 })
            .lean();

        const itemsBySale = Map.groupBy(items, (item) => item.saleId.toString());

        const data = sales.map((sale) => ({
            ...sale,
            items: itemsBySale.get(sale._id.toString()) ?? [],
        }));

        res.json({ data });
    } catch (error) {
        console.error("Error in getCustomerPurchases:", error.message);
        res.status(500).json({ message: "Failed to fetch the customer purchases" });
    }
};

export const getCustomerFavorite = async (req, res) => {
    try {
        const { id } = req.params;

        if (isInvalidId(id)) {
            return res.status(400).json({ message: "Invalid customer ID" });
        }

        if (!(await Customer.exists({ _id: id }))) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const saleIds = await Sale.distinct("_id", { customerId: id });

        const [favorite] = await SaleItem.aggregate([
            { $match: { saleId: { $in: saleIds } } },
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: "$productId",
                    productName: { $last: "$productNameSnapshot" },
                    totalQuantity: { $sum: "$quantity" },
                    timesOrdered: { $sum: 1 },
                    lastOrderedAt: { $max: "$createdAt" },
                },
            },
            { $sort: { totalQuantity: -1, lastOrderedAt: -1 } },
            { $limit: 1 },
            {
                $project: {
                    _id: 0,
                    productId: "$_id",
                    productName: 1,
                    totalQuantity: 1,
                    timesOrdered: 1,
                    lastOrderedAt: 1,
                },
            },
        ]);

        res.json({ data: favorite ?? null });
    } catch (error) {
        console.error("Error in getCustomerFavorite:", error.message);
        res.status(500).json({ message: "Failed to fetch the customer favorite" });
    }
};
