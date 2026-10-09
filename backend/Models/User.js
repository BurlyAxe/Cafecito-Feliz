import mongoose from "mongoose";
import { ROLES } from "../Middlewares/requireRole.js";

const userSchema = new mongoose.Schema(
    {
        username:{
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },

        name:{
            type: String,
            required: true,
            trim: true,
        },

        role:{
            type: String,
            required: true,
            enum: Object.values(ROLES),
        },

        passwordHash:{
            type: String,
            required: true,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;
