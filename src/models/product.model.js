import mongoose, { Schema, model } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    priceNegotiabilityFlag: {
      type: Boolean,
      default: false,
      required: true,
    },

    category: {
      type: String,
      enum: ["Book", "Notes", "ED Kit", "Others"],
      default: "Others",
    },

    description: {
      type: String,
      required: true,
    },

    productImage: {
      type: String,
      required: true,
    },

    productImages: [{ type: String }],

    availability: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.plugin(aggregatePaginate);

export const Product = model("Product", productSchema);
