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
      console.log("Invalid user id.");
      throw new ApiError(400, "Invalid user id");
    }
    const {
      page = 1,
      limit = 10,
      search,
      category,
      minPrice,
      maxPrice,
      availability,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const pipeline = [];
    pipeline.push({
      $match: {
        seller: new mongoose.Types.ObjectId(id),
      },
    });

    // search filter
    if (search) {
      pipeline.push({
        $match: {
          title: { $regex: search, $options: "i" },
        },
      });
    }

    // category filter
    if (category) {
      pipeline.push({
        $match: {
          category: category,
        },
      });
    }

    // price filter
    if (maxPrice || minPrice) {
      const priceFilter = {};
      if (maxPrice) {
        priceFilter.$lte = Number(maxPrice);
      }
      if (minPrice) {
        priceFilter.$gte = Number(minPrice);
      }

      pipeline.push({
        $match: {
          price: priceFilter,
        },
      });
    }

    // availability filter
    if (availability !== undefined) {
      const parsedAvailability =
        availability === "true" || availability === true;
      pipeline.push({
        $match: {
          availability: parsedAvailability,
        },
      });
    }

    const allowedSortFields = ["price", "createdAt", "title"];

    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    pipeline.push({
      $sort: {
        [sortField]: sortOrder === "asc" ? 1 : -1,
      },
    });

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 10);

    const options = {
      page: pageNumber,
      limit: limitNumber,
    };

    const aggregate = Product.aggregate(pipeline);
    const products = await Product.aggregatePaginate(aggregate, options);
    return res
      .status(200)
      .json(
        new ApiResponse(200, products, "All products fetched successfully"),
      );
  } catch (error) {
    console.log("Error while getting products.");
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Error while getting products.",
    );
  }
});

const getProductById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      console.log("Invalid prodcut id.");
      throw new ApiError(400, "Invalid product id");
    }
    const product = await Product.findById(id);
    if (!product) {
      console.log("Product not found.");
      throw new ApiError(404, "Product not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product fetched successfully"));
  } catch (error) {
    console.log("Error getting product by id.");
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Error getting product by id.",
    );
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, description, priceNegotiabilityFlag, availability } =
      req.body;

    if (!isValidObjectId(id)) {
      throw new ApiError(400, "Product id is not valid object id");
    }

    const productToUpdate = await Product.findById(id);

    if (!productToUpdate) {
      throw new ApiError(404, "Product not found");
    }

    if (productToUpdate.seller.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "UnAuthorized to update this product");
    }

    const updatedFields = {};

    if (title && title.trim() !== "") {
      updatedFields.title = title.trim().toUpperCase();
    }

    if (description && description.trim() !== "") {
      updatedFields.description = description.trim();
    }

    if (price !== undefined && !isNaN(Number(price)) && Number(price) > 0) {
      updatedFields.price = Number(price);
    }

    if (
      priceNegotiabilityFlag !== undefined &&
      (priceNegotiabilityFlag === "true" ||
        priceNegotiabilityFlag === "false" ||
        priceNegotiabilityFlag === true ||
        priceNegotiabilityFlag === false)
    ) {
      updatedFields.priceNegotiabilityFlag =
        priceNegotiabilityFlag === "true" || priceNegotiabilityFlag === true;
    }

    if (availability !== undefined) {
      updatedFields.availability =
        availability === "true" || availability === true;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      throw new ApiError(500, "Error while updating product");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedProduct, "Product Updated Successfully"),
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Error while updating product.",
    );
  }
});

const updateProductIconImage = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new ApiError(400, "Product id is not valid object id");
    }

    const productToUpdate = await Product.findById(id);

    if (!productToUpdate) {
      throw new ApiError(404, "Product not found");
    }

    if (productToUpdate.seller.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "UnAuthorized to update this product");
    }

    const productImageLocalPath = req.files?.productImage?.[0];

    if (!productImageLocalPath) {
      throw new ApiError(400, "Product image is required");
    }

    const newProductImage = await uploadOnCloudinary(
      productImageLocalPath.path,
    );

    if (!newProductImage) {
      throw new ApiError(500, "Error uploading new product image");
    }

    if (productToUpdate.productImage) {
      await deleteFromCloudinary(productToUpdate.productImage);
    }

    const response = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          productImage: newProductImage.secure_url,
        },
      },
      { new: true, runValidators: true },
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          response,
          "Product icon image updated successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Error while changing icon image of product.",
    );
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new ApiError(400, "Product id is not valid object id");
    }

    const productToDelete = await Product.findById(id);

    if (!productToDelete) {
      throw new ApiError(404, "Product not found");
    }

    if (
      productToDelete.seller.toString() !== req.user?._id.toString() &&
      req.user?.role !== "admin"
    ) {
      throw new ApiError(403, "UnAuthorized to delete this product");
    }

    if (productToDelete.productImage) {
      await deleteFromCloudinary(productToDelete.productImage);
    }

    if (productToDelete.productImages?.length > 0) {
      for (let i = 0; i < productToDelete.productImages.length; i++) {
        await deleteFromCloudinary(productToDelete.productImages[i]);
      }
    }

    await Product.findByIdAndDelete(id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Product deleted successfully"));
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Error while deleting product.",
    );
  }
});

export {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductIconImage,
  deleteProduct,
};
