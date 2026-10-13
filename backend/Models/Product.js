import mongoose from "mongoose";

export const PRODUCT_CATEGORIES = ["coffee", "tea", "dessert"];

const productSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
            trim: true,
        },

        description:{
            type: String,
            trim: true,
            default: "",
        },

        category:{
            type: String,
            required: true,
            enum: PRODUCT_CATEGORIES,
        },

        price:{
            type: Number,
            required: true,
            min: 0,
        },

        stock:{
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "Stock must be an integer",
            },
        },
    },
    {
        timestamps: true,
    }
);

// Two products cannot share a name, ignoring case: "latte" is the same as "Latte".
// Strength 2 compares letters and accents but not case, so "Te" and "Té" stay different
productSchema.index({ name: 1 }, { unique: true, collation: { locale: "es", strength: 2 } });

const Product = mongoose.model("Product", productSchema);

export default Product;
