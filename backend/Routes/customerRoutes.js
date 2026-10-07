import { Router } from "express";
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerPurchases,
    getCustomerFavorite,
} from "../Controllers/CustomerController.js";
import { requireRole, ROLES } from "../Middlewares/requireRole.js";

const router = Router();

router.get("/", requireRole(ROLES.SELLER, ROLES.ADMIN), getCustomers);
router.get("/:id", requireRole(ROLES.SELLER, ROLES.ADMIN), getCustomerById);
router.get("/:id/purchases", requireRole(ROLES.SELLER, ROLES.ADMIN), getCustomerPurchases);
router.get("/:id/favorite", requireRole(ROLES.SELLER, ROLES.ADMIN), getCustomerFavorite);
router.post("/", requireRole(ROLES.SELLER, ROLES.ADMIN), createCustomer);
router.put("/:id", requireRole(ROLES.SELLER, ROLES.ADMIN), updateCustomer);
router.delete("/:id", requireRole(ROLES.ADMIN), deleteCustomer);

export default router;
