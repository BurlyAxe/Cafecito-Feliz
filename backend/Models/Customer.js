import mongoose from "mongoose";

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
    }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
