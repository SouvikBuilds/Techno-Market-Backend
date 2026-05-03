import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "College Marketplace API",
      version: "1.0.0",
      description:
        "A comprehensive API for a college marketplace platform where students can buy and sell items with email verification, JWT authentication, and role-based access control.",
      contact: {
        name: "Support Team",
        email: "support@collegemarketplace.com",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server",
      },
      {
        url: "https://api.collegemarketplace.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Bearer token authentication",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "JWT token stored in cookie",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "MongoDB ObjectId",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            avatar: {
              type: "string",
              format: "uri",
              description: "Cloudinary image URL",
            },
            stream: {
              type: "string",
              enum: ["Btech", "Bca", "Mca", "Others"],
              example: "Btech",
            },
            branch: {
              type: "string",
              enum: [
                "CSE",
                "IT",
                "Mechanical",
                "Electrical",
                "ECE",
                "Food Technology",
                "Others",
              ],
              example: "CSE",
            },
            year: {
              type: "string",
              enum: ["1st year", "2nd year", "3rd year", "4th year"],
              example: "2nd year",
            },
            availabilityTime: {
              type: "string",
              example: "9 AM to 5 PM",
            },
            role: {
              type: "string",
              enum: ["admin", "user"],
              default: "user",
            },
            isVerified: {
              type: "boolean",
              default: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
          required: ["name", "email", "stream", "branch", "year"],
        },
        Product: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "MongoDB ObjectId",
            },
            seller: {
              type: "string",
              description: "User ObjectId of the seller",
            },
            title: {
              type: "string",
              example: "Advanced DSA Notes",
            },
            price: {
              type: "number",
              example: 299,
            },
            priceNegotiabilityFlag: {
              type: "boolean",
              default: false,
              description: "Whether the price is negotiable",
            },
            category: {
              type: "string",
              enum: ["Book", "Notes", "ED Kit", "Others"],
              example: "Notes",
            },
            description: {
              type: "string",
              example: "Complete Data Structure notes with examples",
            },
            productImage: {
              type: "string",
              format: "uri",
              description: "Main product image URL from Cloudinary",
            },
            productImages: {
              type: "array",
              items: {
                type: "string",
                format: "uri",
              },
              maxItems: 4,
              description: "Additional product images (up to 4)",
            },
            availability: {
              type: "boolean",
              default: false,
              description: "Whether the product is available",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
          required: [
            "seller",
            "title",
            "price",
            "category",
            "description",
            "productImage",
            "availability",
          ],
        },
        Interest: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "MongoDB ObjectId",
            },
            product: {
              type: "string",
              description: "Product ObjectId",
            },
            buyer: {
              type: "string",
              description: "Buyer User ObjectId",
            },
            seller: {
              type: "string",
              description: "Seller User ObjectId",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            statusCode: {
              type: "integer",
              example: 400,
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            statusCode: {
              type: "integer",
              example: 200,
            },
            data: {
              type: "object",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ["./src/swagger.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
