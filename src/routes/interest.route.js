import express, { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { sendInterest } from "../controllers/interest.controller.js";

const router = Router();

router.route("/send-interest/:productId").post(verifyJWT, sendInterest);
export default router;
