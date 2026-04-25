import { verifyJWT, upload } from "../middlewares/index.js";
import {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductIconImage,
  deleteProduct,
} from "../controllers/product.controller.js";
import { Router } from "express";

const router = Router();

router.route("/add").post(
  verifyJWT,
  upload.fields([
    { name: "productImage", maxCount: 1 },
    { name: "productImages", maxCount: 4 },
  ]),
  addProduct,
);

router.route("/").get(getAllProducts);
router.route("/:id").get(getProductById);

router.route("/:id").patch(verifyJWT, updateProduct);

router
  .route("/update-icon-image/:id")
  .patch(
    verifyJWT,
    upload.fields([{ name: "productImage", maxCount: 1 }]),
    updateProductIconImage,
  );

router.route("/:id").delete(verifyJWT, deleteProduct);

export default router;
