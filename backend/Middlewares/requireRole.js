export const ROLES = { SELLER: "seller", ADMIN: "admin" };

export const getRole = (req) => req.header("x-user-role");

export const requireRole = (...allowed) => (req, res, next) => {
    if (!allowed.includes(getRole(req))) {
        return res.status(403).json({ message: "Forbidden" });
    }

    next();
};
