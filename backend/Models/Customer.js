import mongoose from "mongoose";

// Frequent customer discount: from minPurchases previous purchases, percent off
export const DISCOUNT_TIERS = [
    { minPurchases: 20, percent: 15 },
    { minPurchases: 10, percent: 10 },
    { minPurchases: 5, percent: 5 },
];

export const getDiscountPercent = (purchasesCount) =>
    DISCOUNT_TIERS.find((tier) => purchasesCount >= tier.minPurchases)?.percent ?? 0;

const customerSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
            trim: true,
        },

        phone:{
            type: String,
            required: true,
            trim: true,
            match: [/^\d{10}$/, "Phone must have exactly 10 digits"],
        },

        email:{
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            match: [/^\S+@\S+\.\S+$/, "Email format is not valid"],
        },

        purchasesCount:{
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
        // The JSON sent to the front includes discountPercent (but no duplicated "id")
        toJSON: { virtuals: true },
        id: false,
    }
);

// Calculated, not stored: it always matches the current purchasesCount
customerSchema.virtual("discountPercent").get(function () {
    return getDiscountPercent(this.purchasesCount);
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
