import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
    {
        customerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
            index: true,
        },

        paymentMethod:{
            type: String,
            required: true,
            enum: ['cash', 'card', 'transfer'],
        },

        subtotal:{
            type: Number,
            required: true,
            min: 0,
        },

        discountPercent:{
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        discountAmount:{
            type: Number,
            default: 0,
            min: 0,
        },

        total:{
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
