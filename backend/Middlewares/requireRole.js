import { verifyToken } from "../Services/authService.js";

export const ROLES = { SELLER: "seller", ADMIN: "admin" };

const readBearerToken = (req) => req.header("authorization")?.match(/^Bearer (\S+)$/)?.[1];

// The role comes from the signed token, never from a header the client writes.
// Public routes call this too: without a valid token the request is just anonymous
export const getRole = (req) => {
    if (req.user) return req.user.role;

    const token = readBearerToken(req);

    return token ? verifyToken(token)?.role : undefined;
};

export const requireRole = (...allowed) => (req, res, next) => {
    const token = readBearerToken(req);

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!allowed.includes(payload.role)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    req.user = payload;
    next();
};
