import { Router } from "express";
import { previewCart, createSale, getSaleById } from "../Controllers/SaleController.js";
import { requireRole, ROLES } from "../Middlewares/requireRole.js";

const router = Router();

router.post("/cart", previewCart);
router.post("/", requireRole(ROLES.SELLER, ROLES.ADMIN), createSale);
router.get("/:id", requireRole(ROLES.SELLER, ROLES.ADMIN), getSaleById);

export default router;
