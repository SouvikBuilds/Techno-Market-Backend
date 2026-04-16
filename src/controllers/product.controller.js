import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import {
  asyncHandler,
  ApiError,
  ApiResponse,
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/index.js";

const addProduct = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      price,
      priceNegotiabilityFlag,
      category,
      description,
      availability,
    } = req.body;

    if (
      !title ||
      !description ||
      title.trim().length === 0 ||
      description.trim().length === 0 ||
      availability === undefined ||
      priceNegotiabilityFlag === undefined ||
      category === undefined ||
      price === undefined
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const parsedPrice = Number(price);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      throw new ApiError(400, "Price must be a positive number");
    }

    const parsedAvailability = availability === "true" || availability === true;
    const parsedNegotiable =
      priceNegotiabilityFlag === "true" || priceNegotiabilityFlag === true;
    const productImageLocalPath = req.files?.productImage?.[0];
    if (!productImageLocalPath) {
      console.log("Product image local path is missing");
      throw new ApiError(400, "Product image is required");
    }

    const productImage = await uploadOnCloudinary(productImageLocalPath.path);

    const productImagesLocal = req.files?.productImages || [];
    const productImages = [];

    for (let i = 0; i < productImagesLocal.length; i++) {
      const uploaded = await uploadOnCloudinary(productImagesLocal[i].path);
      productImages.push(uploaded.secure_url);
    }

    const product = await Product.create({
      title: title.trim().toUpperCase(),
      description,
      price: parsedPrice,
      priceNegotiabilityFlag: parsedNegotiable,
      availability: parsedAvailability,
      category,
      productImage: productImage.secure_url,
      productImages,
      seller: req.user?._id,
    });

    const createdProduct = await Product.findById(product?._id);
    return res
      .status(201)
      .json(
        new ApiResponse(201, createdProduct, "new product added successfully"),
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while adding product",
    );
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const id = req.user?._id;
    if (!isValidObjectId(id)) {
      console.log("Not valid user id");
      throw new ApiError(400, "Invalid user id");
    }

    const aggregate = Product.aggregate([{ $match: { seller: id } }]);
    const options = {
      page: 1,
      limit: 10,
    };
    const products = await Product.aggregatePaginate(aggregate, options);
    return res
      .status(200)
      .json(
        new ApiResponse(200, products, "All products fetched successfully"),
      );
  } catch (error) {
    console.log("Error while getting all products: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error while getting all products",
    );
  }
});

export { addProduct, getAllProducts };
