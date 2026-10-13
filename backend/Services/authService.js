import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";

const scryptAsync = promisify(scrypt);

const SALT_BYTES = 16;
const KEY_BYTES = 64;

export const hashPassword = async (password) => {
    const salt = randomBytes(SALT_BYTES).toString("hex");
    const key = await scryptAsync(password, salt, KEY_BYTES);

    return `${salt}:${key.toString("hex")}`;
};

export const verifyPassword = async (password, storedHash) => {
    try {
        const [salt, hash] = String(storedHash).split(":");

        if (!salt || !hash) return false;

        const expected = Buffer.from(hash, "hex");

        if (expected.length !== KEY_BYTES) return false;

        const key = await scryptAsync(password, salt, KEY_BYTES);

        return timingSafeEqual(key, expected);
    } catch {
        return false;
    }
};

// Session tokens are JWTs signed with HS256. The payload is readable by anyone
// (it is only base64), but nobody can change it without the secret
const TOKEN_ALGORITHM = "HS256";
const TOKEN_TTL = "8h";

export const createToken = (user) =>
    jwt.sign(
        { sub: user._id.toString(), name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { algorithm: TOKEN_ALGORITHM, expiresIn: TOKEN_TTL }
    );

// Returns the payload, or null when the token is forged, malformed or expired
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET, { algorithms: [TOKEN_ALGORITHM] });
    } catch {
        return null;
    }
};
