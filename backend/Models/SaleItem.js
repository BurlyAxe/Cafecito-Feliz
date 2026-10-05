import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema(
    {
        saleId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale',
            required: true,
            index: true,
        },

        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        productNameSnapshot:{
            type: String,
            required: true,
            trim: true,
        },

        unitPriceSnapshot:{
            type: Number,
            required: true,
            min: 0,
        },

        quantity:{
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "La cantidad debe ser un número entero",
            },
        },

        lineTotal:{
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

const SaleItem = mongoose.model("SaleItem", saleItemSchema);

export default SaleItem;
