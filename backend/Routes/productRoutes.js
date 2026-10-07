import { Router } from "express";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    adjustStock,
    deleteProduct,
} from "../Controllers/ProductController.js";
import { requireRole, ROLES } from "../Middlewares/requireRole.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", requireRole(ROLES.SELLER, ROLES.ADMIN), createProduct);
router.put("/:id", requireRole(ROLES.SELLER, ROLES.ADMIN), updateProduct);
router.patch("/:id/stock", requireRole(ROLES.SELLER, ROLES.ADMIN), adjustStock);
router.delete("/:id", requireRole(ROLES.SELLER, ROLES.ADMIN), deleteProduct);

export default router;
