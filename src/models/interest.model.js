import mongoose, { model, Schema } from "mongoose";

const interestSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

interestSchema.index({ product: 1, buyer: 1 }, { unique: true });
export const Interest = model("Interest", interestSchema);
