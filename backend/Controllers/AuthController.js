import User from "../Models/User.js";
import { createToken, verifyPassword } from "../Services/authService.js";

const isFilled = (value) => typeof value === "string" && value.trim() !== "";

export const login = async (req, res) => {
    try {
        const { username, password } = req.body ?? {};

        const errors = [];

        if (!isFilled(username)) errors.push("username is required");
        if (!isFilled(password)) errors.push("password is required");

        if (errors.length > 0) {
            return res.status(400).json({ message: "Invalid data", errors });
        }

        const user = await User.findOne({
            username: username.trim().toLowerCase(),
        }).select("+passwordHash");

        const valid = user ? await verifyPassword(password, user.passwordHash) : false;

        if (!valid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.json({
            message: "Login successful",
            data: {
                name: user.name,
                username: user.username,
                role: user.role,
                token: createToken(user),
            },
        });
    } catch (error) {
        console.error("Error in login:", error.message);
        res.status(500).json({ message: "Failed to log in" });
    }
};
