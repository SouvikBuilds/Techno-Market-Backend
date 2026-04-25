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

router.route("/:id").get(getAllProducts);
router.route("/product/:id").get(getProductById);

router.route("/product/:id").patch(verifyJWT, updateProduct);

router
  .route("/product/update-icon-image/:id")
  .patch(
    verifyJWT,
    upload.fields([{ name: "productImage", maxCount: 1 }]),
    updateProductIconImage,
  );

router.route("/delete-product/:id").delete(verifyJWT, deleteProduct);

export default router;
