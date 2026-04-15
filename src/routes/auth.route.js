import express, { Router } from "express";
import {
  registerUser,
  resendVerifyEmail,
  verifyUser,
  loginUser,
  updateUser,
  getCurrentUser,
  refreshAccessToken,
  logOutUser,
  updateProfilePicture,
  changeCurrentPassword,
} from "../controllers/user.controller.js";

import { verifyJWT, upload } from "../middlewares/index.js";

const router = Router();

router.route("/signup").post(upload.single("avatar"), registerUser);
router.route("/verify/me").post(verifyUser);
router.route("/send/verifyCode").post(resendVerifyEmail);
router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logOutUser);
router.route("/update/me").patch(verifyJWT, updateUser);
router
  .route("/update/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateProfilePicture);

router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/change/password").patch(verifyJWT, changeCurrentPassword);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
