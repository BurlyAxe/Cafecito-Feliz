import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

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
