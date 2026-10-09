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

const Product = mongoose.model("Product", productSchema);

export default Product;
