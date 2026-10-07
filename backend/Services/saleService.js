import mongoose from "mongoose";
import Customer from "../Models/Customer.js";
import Product from "../Models/Product.js";
import Sale from "../Models/Sale.js";
import SaleItem from "../Models/SaleItem.js";

const isInvalidId = (id) => !mongoose.Types.ObjectId.isValid(id);

const PAYMENT_METHODS = Sale.schema.path("paymentMethod").enumValues;

const DISCOUNT_TIERS = [
    { minPurchases: 20, percent: 15 },
    { minPurchases: 10, percent: 10 },
    { minPurchases: 5, percent: 5 },
];

export class SaleError extends Error {
    constructor(status, message, errors = []) {
        super(message);
        this.name = "SaleError";
        this.status = status;
        this.errors = errors;
    }
}

const toCents = (amount) => Math.round(amount * 100);

const fromCents = (cents) => cents / 100;

const getDiscountPercent = (purchasesCount) =>
    DISCOUNT_TIERS.find((tier) => purchasesCount >= tier.minPurchases)?.percent ?? 0;

const buildTotals = (subtotalCents, discountPercent) => {
    const discountCents = Math.round((subtotalCents * discountPercent) / 100);

    return {
        subtotal: fromCents(subtotalCents),
        discountPercent,
        discountAmount: fromCents(discountCents),
        total: fromCents(subtotalCents - discountCents),
    };
};

const isMissing = (value) => value === undefined || value === null;

const validateCustomerId = (customerId, required) => {
    if (isMissing(customerId)) {
        return required ? ["customerId is required"] : [];
    }

    return isInvalidId(customerId) ? ["customerId is not a valid ID"] : [];
};

const validatePaymentMethod = (paymentMethod) => {
    if (isMissing(paymentMethod)) {
        return ["paymentMethod is required"];
    }

    return PAYMENT_METHODS.includes(paymentMethod)
        ? []
        : [`paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}`];
};

const parseItems = (items) => {
    if (isMissing(items)) {
        return { errors: ["items is required"], lines: [] };
    }

    if (!Array.isArray(items) || items.length === 0) {
        return { errors: ["items must be a non-empty array"], lines: [] };
    }

    const errors = [];
    const merged = new Map();

    items.forEach((item, index) => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) {
            errors.push(`items[${index}] must be an object`);
            return;
        }

        const { productId, quantity } = item;
        let lineIsValid = true;

        if (isMissing(productId)) {
            errors.push(`items[${index}].productId is required`);
            lineIsValid = false;
        } else if (isInvalidId(productId)) {
            errors.push(`items[${index}].productId is not a valid ID`);
            lineIsValid = false;
        }

        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            errors.push(`items[${index}].quantity must be a positive integer`);
            lineIsValid = false;
        }

        if (!lineIsValid) return;

        const key = String(productId).toLowerCase();
        merged.set(key, (merged.get(key) ?? 0) + quantity);
    });

    const lines = [...merged].map(([productId, quantity]) => ({ productId, quantity }));

    return { errors, lines };
};

const findCustomer = async (customerId) => {
    const customer = await Customer.findById(customerId).lean();

    if (!customer) {
        throw new SaleError(404, "Customer not found");
    }

    return customer;
};

const findProducts = async (lines) => {
    const products = await Product.find({
        _id: { $in: lines.map((line) => line.productId) },
    }).lean();

    const productsById = new Map(products.map((product) => [product._id.toString(), product]));

    const missing = lines
        .filter((line) => !productsById.has(line.productId))
        .map((line) => `Product ${line.productId} does not exist`);

    if (missing.length > 0) {
        throw new SaleError(404, "Product not found", missing);
    }

    return productsById;
};

const priceLines = (lines, productsById) =>
    lines.map(({ productId, quantity }) => {
        const product = productsById.get(productId);
        const unitCents = toCents(product.price);

        return {
            productId,
            name: product.name,
            quantity,
            available: product.stock,
            unitCents,
            lineCents: unitCents * quantity,
        };
    });

const sumCents = (pricedLines) => pricedLines.reduce((sum, line) => sum + line.lineCents, 0);

const insufficientStockMessage = (name, requested, available) =>
    `Insufficient stock for "${name}": requested ${requested}, available ${available}`;

const assertStock = (pricedLines) => {
    const shortages = pricedLines
        .filter((line) => line.available < line.quantity)
        .map((line) => insufficientStockMessage(line.name, line.quantity, line.available));

    if (shortages.length > 0) {
        throw new SaleError(409, "Insufficient stock", shortages);
    }
};

const reserveStock = async ({ productId, quantity }) => {
    const result = await Product.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
    );

    if (result.matchedCount === 1) return;

    const current = await Product.findById(productId).select("name stock").lean();

    if (!current) {
        throw new SaleError(404, "Product not found", [`Product ${productId} does not exist`]);
    }

    throw new SaleError(409, "Insufficient stock", [
        insufficientStockMessage(current.name, quantity, current.stock),
    ]);
};

const rollback = async (undoSteps) => {
    for (const step of [...undoSteps].reverse()) {
        try {
            await step.run();
        } catch (error) {
            console.error(`Rollback failed (${step.label}):`, error.message);
        }
    }
};

export const quoteCart = async (body) => {
    const { customerId, items } = body ?? {};

    const { errors: itemErrors, lines } = parseItems(items);
    const errors = [...validateCustomerId(customerId, false), ...itemErrors];

    if (errors.length > 0) {
        throw new SaleError(400, "Invalid data", errors);
    }

    const customer = isMissing(customerId) ? null : await findCustomer(customerId);
    const productsById = await findProducts(lines);
    const pricedLines = priceLines(lines, productsById);

    const cartItems = pricedLines.map((line) => ({
        productId: line.productId,
        name: line.name,
        unitPrice: fromCents(line.unitCents),
        quantity: line.quantity,
        lineTotal: fromCents(line.lineCents),
        available: line.available,
        hasEnoughStock: line.available >= line.quantity,
    }));

    return {
        customerId: customer ? customer._id : null,
        items: cartItems,
        ...buildTotals(sumCents(pricedLines), getDiscountPercent(customer?.purchasesCount ?? 0)),
        canCheckout: cartItems.every((item) => item.hasEnoughStock),
    };
};

export const registerSale = async (body) => {
    const { customerId, paymentMethod, items } = body ?? {};

    const { errors: itemErrors, lines } = parseItems(items);
    const errors = [
        ...validateCustomerId(customerId, true),
        ...validatePaymentMethod(paymentMethod),
        ...itemErrors,
    ];

    if (errors.length > 0) {
        throw new SaleError(400, "Invalid data", errors);
    }

    const customer = await findCustomer(customerId);
    const productsById = await findProducts(lines);
    const pricedLines = priceLines(lines, productsById);

    assertStock(pricedLines);

    const subtotalCents = sumCents(pricedLines);

    const sale = new Sale({
        customerId: customer._id,
        paymentMethod,
        ...buildTotals(subtotalCents, getDiscountPercent(customer.purchasesCount)),
    });

    const saleItems = pricedLines.map(
        (line) =>
            new SaleItem({
                saleId: sale._id,
                productId: line.productId,
                productNameSnapshot: line.name,
                unitPriceSnapshot: fromCents(line.unitCents),
                quantity: line.quantity,
                lineTotal: fromCents(line.lineCents),
            })
    );

    await Promise.all([sale.validate(), ...saleItems.map((item) => item.validate())]);

    const undoSteps = [];

    try {
        for (const line of pricedLines) {
            await reserveStock(line);

            undoSteps.push({
                label: `restore ${line.quantity} stock of product ${line.productId}`,
                run: () => Product.updateOne({ _id: line.productId }, { $inc: { stock: line.quantity } }),
            });
        }

        const customerBefore = await Customer.findOneAndUpdate(
            { _id: customer._id },
            { $inc: { purchasesCount: 1 } },
            { returnDocument: "before" }
        )
            .select("purchasesCount")
            .lean();

        if (!customerBefore) {
            throw new SaleError(404, "Customer not found");
        }

        undoSteps.push({
            label: `decrement purchasesCount of customer ${customer._id}`,
            run: () => Customer.updateOne({ _id: customer._id }, { $inc: { purchasesCount: -1 } }),
        });

        sale.set(buildTotals(subtotalCents, getDiscountPercent(customerBefore.purchasesCount)));

        undoSteps.push({
            label: `delete items of sale ${sale._id}`,
            run: () => SaleItem.deleteMany({ saleId: sale._id }),
        });

        await SaleItem.insertMany(saleItems);
    } catch (error) {
        await rollback(undoSteps);
        throw error;
    }

    try {
        await sale.save();
    } catch (error) {
        let committed;

        try {
            committed = await Sale.exists({ _id: sale._id });
        } catch (checkError) {
            console.error(
                `Manual reconciliation required for sale ${sale._id}: save failed (${error.message}) and the existence check failed (${checkError.message})`
            );
            throw error;
        }

        if (!committed) {
            await rollback(undoSteps);
            throw error;
        }

        console.error(`Sale ${sale._id} reported a save error but was committed:`, error.message);
    }

    return {
        ...sale.toObject(),
        items: saleItems.map((item) => item.toObject()),
    };
};
