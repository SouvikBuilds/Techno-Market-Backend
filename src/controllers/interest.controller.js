import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Interest } from "../models/interest.model.js";
import { asyncHandler, ApiError, ApiResponse } from "../utils/index.js";
import { isValidObjectId } from "mongoose";
import { sendInterestedMail } from "../services/mailer.service.js";

export const sendInterest = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(userId) || !isValidObjectId(productId)) {
      throw new ApiError(400, "Invalid Object Id");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const existingInterest = await Interest.findOne({
      product: productId,
      buyer: userId,
    });

    if (existingInterest) {
      throw new ApiError(409, "Interest already sent");
    }

    const seller = await User.findById(product.seller);
    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }

    const buyer = await User.findById(userId);

    const response = await Interest.create({
      product: productId,
      seller: seller._id,
      buyer: userId,
    });

    const subject = "New Interest in Your Product";

    const html = `
      <h3>Someone is interested in your product</h3>
      <p><strong>Product:</strong> ${product.title}</p>
      <p><strong>Buyer Name:</strong> ${buyer.name}</p>
      <p><strong>Buyer Email:</strong> ${buyer.email}</p>
    `;

    await sendInterestedMail(seller.email, subject, html);

    return res
      .status(200)
      .json(new ApiResponse(200, response, "Interest sent successfully"));
  } catch (error) {
    console.log("Error in sending interest: ", error.message);
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Error while sending mail",
    );
  }
});
