import productService from "../services/productService.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { env } from "../config/env.js";

// H-5 FIX: SSRF protection — block requests to private/internal networks
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
];
const BLOCKED_IP_PREFIXES = [
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
  "192.168.",
  "169.254.",
  "fd",
  "fe80",
];

function isSafeUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return false;
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) return false;
    if (BLOCKED_IP_PREFIXES.some((prefix) => hostname.startsWith(prefix)))
      return false;
    // Block AWS/GCP/Azure metadata endpoints
    if (hostname === "169.254.169.254") return false;
    return true;
  } catch (_) {
    return false;
  }
}

// C-6 FIX: Import rate limiting — per-window counter
const importCounters = new Map();
const IMPORT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_IMPORTS_PER_WINDOW = 500;
class ProductController {
  async getProducts(req, res, next) {
    try {
      const {
        page,
        limit,
        search,
        category,
        brand,
        minRating,
        minPrice,
        maxPrice,
        inStock,
        stockStatus,
        sort,
        featured,
        trending,
        newArrival,
        bestSeller,
        recommended,
        sale,
        includeInventoryCounts,
      } = req.query;
      const data = await productService.getProducts({
        page,
        limit,
        search,
        category,
        brand,
        minRating,
        minPrice,
        maxPrice,
        inStock,
        stockStatus,
        sort,
        featured,
        trending,
        newArrival,
        bestSeller,
        recommended,
        sale,
        includeInventoryCounts,
      });
      return successResponse(res, "Products retrieved successfully", data, 200);
    } catch (error) {
      next(error);
    }
  }

  async getSearchSuggestions(req, res, next) {
    try {
      const { q } = req.query;
      if (!q)
        return successResponse(
          res,
          "Suggestions retrieved",
          { suggestions: [] },
          200,
        );

      // Use productService to get products matching the query
      const data = await productService.getProducts({ search: q, limit: 5 });
      const suggestions = data.products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        thumbnail: p.thumbnail,
        category: p.category,
        finalPrice: p.finalPrice || p.price,
      }));

      return successResponse(
        res,
        "Suggestions retrieved successfully",
        { suggestions },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getHomeProducts(req, res, next) {
    try {
      // Optimized parallel fetching for homepage sections
      let [featured, trending, newArrivals, bestSellers, sale] =
        await Promise.all([
          productService.getProducts({ featured: "true", limit: 8 }),
          productService.getProducts({ trending: "true", limit: 8 }),
          productService.getProducts({ newArrival: "true", limit: 8 }),
          productService.getProducts({ bestSeller: "true", limit: 8 }),
          productService.getProducts({ sale: "true", limit: 8 }),
        ]);

      // Fallbacks if any section is empty
      if (!featured.products || featured.products.length === 0) {
        featured = await productService.getProducts({
          limit: 8,
          sort: "newest",
        });
      }
      if (!trending.products || trending.products.length === 0) {
        trending = await productService.getProducts({
          limit: 8,
          sort: "popular",
        });
      }
      if (!newArrivals.products || newArrivals.products.length === 0) {
        newArrivals = await productService.getProducts({
          limit: 8,
          sort: "newest",
        });
      }
      if (!bestSellers.products || bestSellers.products.length === 0) {
        bestSellers = await productService.getProducts({
          limit: 8,
          sort: "popular",
        });
      }
      if (!sale.products || sale.products.length === 0) {
        sale = await productService.getProducts({ limit: 8, sort: "discount" });
      }

      return successResponse(
        res,
        "Home products retrieved successfully",
        {
          featured: featured.products,
          trending: trending.products,
          newArrivals: newArrivals.products,
          bestSellers: bestSellers.products,
          sale: sale.products,
        },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedProducts(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({
        featured: "true",
        limit: parseInt(limit, 10),
      });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({
          limit: parseInt(limit, 10),
          sort: "newest",
        });
      }
      return successResponse(
        res,
        "Featured products retrieved successfully",
        { products: data.products },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getTrendingProducts(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({
        trending: "true",
        limit: parseInt(limit, 10),
      });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({
          limit: parseInt(limit, 10),
          sort: "popular",
        });
      }
      return successResponse(
        res,
        "Trending products retrieved successfully",
        { products: data.products },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getNewProducts(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({
        newArrival: "true",
        limit: parseInt(limit, 10),
      });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({
          limit: parseInt(limit, 10),
          sort: "newest",
        });
      }
      return successResponse(
        res,
        "New products retrieved successfully",
        { products: data.products },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getBestSellers(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({
        bestSeller: "true",
        limit: parseInt(limit, 10),
      });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({
          limit: parseInt(limit, 10),
          sort: "popular",
        });
      }
      return successResponse(
        res,
        "Best seller products retrieved successfully",
        { products: data.products },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getRecommendedProductsEndpoint(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({
        recommended: "true",
        limit: parseInt(limit, 10),
      });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({
          limit: parseInt(limit, 10),
          sort: "highest_rated",
        });
      }
      return successResponse(
        res,
        "Recommended products retrieved successfully",
        { products: data.products },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getRelatedProducts(req, res, next) {
    try {
      const { id } = req.params;
      const { limit } = req.query;
      const products = await productService.getRelatedProducts(id, limit);
      return successResponse(
        res,
        "Related products retrieved successfully",
        { products },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return successResponse(
        res,
        "Product retrieved successfully",
        { product },
        200,
      );
    } catch (error) {
      if (error.message === "Product not found") {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      return successResponse(
        res,
        "Product created successfully",
        { product },
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.body,
      );
      return successResponse(
        res,
        "Product updated successfully",
        { product },
        200,
      );
    } catch (error) {
      if (error.message === "Product not found") {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      return successResponse(res, "Product deleted successfully", {}, 200);
    } catch (error) {
      if (error.message === "Product not found") {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }

  async bulkDeleteProducts(req, res, next) {
    try {
      const { productIds } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return errorResponse(
          res,
          "productIds must be a non-empty array",
          [],
          400,
        );
      }
      if (productIds.length > 100) {
        return errorResponse(
          res,
          "Bulk delete is limited to a maximum of 100 products at a time.",
          [],
          400,
        );
      }
      const result = await productService.bulkDeleteProducts(productIds);
      return successResponse(
        res,
        `${result.deleted} product(s) deleted successfully`,
        result,
        200,
      );
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, [], error.statusCode);
      }
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories();
      return successResponse(
        res,
        "Categories retrieved successfully",
        { categories },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async notifyStock(req, res, next) {
    try {
      const { id } = req.params;
      const { email, phone } = req.body;
      const userId = req.user?.id || null;

      if (!email) {
        return errorResponse(res, "Email is required", [], 400);
      }

      // We need to import prisma at the top of the file or use a service.
      // Since it's a simple operation, we can do it via productService or directly here.
      // We'll use productService.
      await productService.createStockNotification(id, email, phone, userId);
      return successResponse(
        res,
        "Notification request received successfully",
        {},
        200,
      );
    } catch (error) {
      if (error.code === "P2002") {
        // Unique constraint failed on the fields: (`productId`,`email`)
        return successResponse(
          res,
          "You are already on the notification list for this product",
          {},
          200,
        );
      }
      if (error.message === "Product not found") {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }
  async getNotifyStatus(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const email = req.user.email;

      const { default: prisma } = await import("../lib/prisma.js");
      const notification = await prisma.stockNotification.findFirst({
        where: {
          productId: id,
          OR: [{ userId }, { email }],
        },
      });

      return successResponse(
        res,
        "Notification status retrieved",
        { isSubscribed: !!notification },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async downloadCsvTemplate(req, res, next) {
    try {
      const headers =
        "Product Name,Category,Brand,Price,Discount,Stock Quantity,Description,Primary Image,Secondary Image,Active,Featured Product,Trending Product,Best Seller,New Arrival,Recommended\n";
      const exampleRow =
        "Modern Sofa,Living Room,FurnitureCo,45000,10,12,Premium comfort fabric sofa,https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80,https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1200&q=80,TRUE,FALSE,FALSE,FALSE,TRUE,FALSE\n";
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=product_import_template.csv",
      );
      return res.status(200).send(headers + exampleRow);
    } catch (error) {
      next(error);
    }
  }

  async downloadExcelTemplate(req, res, next) {
    try {
      const xlsx = await import("xlsx");
      const headers = [
        "Product Name",
        "Category",
        "Brand",
        "Price",
        "Discount",
        "Stock Quantity",
        "Description",
        "Primary Image",
        "Secondary Image",
        "Active",
        "Featured Product",
        "Trending Product",
        "Best Seller",
        "New Arrival",
        "Recommended",
      ];
      const exampleRow = [
        "Modern Sofa",
        "Living Room",
        "FurnitureCo",
        45000,
        10,
        12,
        "Premium comfort fabric sofa",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80",
        "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1200&q=80",
        "TRUE",
        "FALSE",
        "FALSE",
        "FALSE",
        "TRUE",
        "FALSE",
      ];

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([headers, exampleRow]);
      xlsx.utils.book_append_sheet(wb, ws, "Products");

      const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=product_import_template.xlsx",
      );
      return res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async importPreview(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, "No import file provided", [], 400);
      }

      const xlsx = await import("xlsx");
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

      if (rawRows.length > 500) {
        return errorResponse(
          res,
          "Import file contains too many rows. Maximum limit is 500 rows per file.",
          [],
          400,
        );
      }

      // Fetch existing name + brand keys from database to find duplicates
      const { default: prisma } = await import("../lib/prisma.js");
      const products = await prisma.product.findMany({
        select: { name: true, brand: true },
      });
      const dbProductKeys = new Set(
        products.map(
          (p) =>
            `${p.name.trim().toLowerCase()}|${p.brand.trim().toLowerCase()}`,
        ),
      );

      // Fetch active categories
      const categories = await prisma.product.groupBy({
        by: ["category"],
        where: { active: true },
      });
      const dbCategories = categories.map((c) => c.category);

      const ALLOWED_CATEGORIES = [
        "Living Room",
        "Bedroom",
        "Dining Room",
        "Office",
        "Outdoor",
        "Kitchen",
        "Decor",
        "Lighting",
      ];

      const normalizeCategory = (category) => {
        if (!category) return "Decor";
        return category
          .trim()
          .replace(/\s+/g, " ")
          .split(" ")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");
      };

      const parseBoolean = (val) => {
        if (val === undefined || val === null) return false;
        if (typeof val === "boolean") return val;
        const str = String(val).trim().toLowerCase();
        return (
          str === "true" ||
          str === "yes" ||
          str === "1" ||
          str === "active" ||
          str === "enabled"
        );
      };

      const mapRowKeys = (row) => {
        const mapped = {};
        const normalize = (key) =>
          key
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        const keyMap = {
          productname: "name",
          category: "category",
          brand: "brand",
          price: "price",
          discount: "discountPercentage",
          stockquantity: "stock",
          description: "description",
          primaryimage: "primaryImage",
          secondaryimage: "secondaryImage",
          active: "active",
          featuredproduct: "featured",
          trendingproduct: "trending",
          bestseller: "bestSeller",
          newarrival: "newArrival",
          recommended: "recommended",
        };

        for (const [key, value] of Object.entries(row)) {
          const normKey = normalize(key);
          const targetKey = keyMap[normKey];
          if (targetKey) {
            mapped[targetKey] = value;
          }
        }
        return mapped;
      };

      const { validateProductInput } =
        await import("../utils/productValidation.js");

      const validateRow = (row, rowNumber, fileProducts) => {
        const errors = [];

        // 1. Cast numeric fields
        const price = parseFloat(row.price);
        const discountPercentage = parseFloat(row.discountPercentage) || 0;
        const stock = parseInt(row.stock, 10);

        const validationPayload = {
          name: row.name ? String(row.name).trim() : "",
          category: row.category ? String(row.category).trim() : "",
          brand: row.brand ? String(row.brand).trim() : "",
          price: isNaN(price) ? 0 : price,
          discountPercentage: isNaN(discountPercentage)
            ? 0
            : discountPercentage,
          stock: isNaN(stock) ? 0 : stock,
          description: row.description ? String(row.description).trim() : "",
        };

        // Reuse existing validation
        const { isValid, errors: validationErrors } =
          validateProductInput(validationPayload);
        if (!isValid) {
          errors.push(...Object.values(validationErrors));
        }

        // 2. Duplicate check within file and DB
        const nameBrandKey = `${validationPayload.name.toLowerCase()}|${validationPayload.brand.toLowerCase()}`;
        if (validationPayload.name && validationPayload.brand) {
          if (fileProducts.has(nameBrandKey)) {
            errors.push("Duplicate product in file");
          } else if (dbProductKeys.has(nameBrandKey)) {
            errors.push("A product with this name and brand already exists");
          }
          fileProducts.add(nameBrandKey);
        }

        // 3. Category existence
        if (validationPayload.category) {
          const normalizedCat = normalizeCategory(validationPayload.category);
          const categoryExists =
            ALLOWED_CATEGORIES.includes(normalizedCat) ||
            dbCategories.includes(normalizedCat);
          if (!categoryExists) {
            errors.push("Invalid Category");
          }
        }

        // H-5 FIX: Validate URLs for SSRF before passing to image service
        const checkUrl = (url, label) => {
          if (url) {
            if (!isSafeUrl(url)) {
              errors.push(
                `Blocked URL for ${label}: internal/private network addresses are not allowed`,
              );
              return;
            }
            try {
              const parsed = new URL(url);
              if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                errors.push(`Invalid URL protocol for ${label}`);
              }
            } catch (_) {
              errors.push(`Invalid URL format for ${label}`);
            }
          }
        };
        checkUrl(row.primaryImage, "Primary Image");
        checkUrl(row.secondaryImage, "Secondary Image");

        return {
          rowNumber,
          isValid: errors.length === 0,
          errors,
          data: {
            ...row,
            price: validationPayload.price,
            discountPercentage: validationPayload.discountPercentage,
            stock: validationPayload.stock,
            active: parseBoolean(row.active),
            featured: parseBoolean(row.featured),
            trending: parseBoolean(row.trending),
            bestSeller: parseBoolean(row.bestSeller),
            newArrival: parseBoolean(row.newArrival),
            recommended: parseBoolean(row.recommended),
          },
        };
      };

      const validRows = [];
      const invalidRows = [];
      const fileProducts = new Set(); // to find duplicates within the uploaded file itself

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowNumber = i + 2; // Row numbers are 1-based, plus headers is 2-based
        const mapped = mapRowKeys(row);

        const result = validateRow(mapped, rowNumber, fileProducts);
        if (result.isValid) {
          validRows.push(result.data);
        } else {
          invalidRows.push({
            rowNumber,
            errors: result.errors,
            row: row,
          });
        }
      }

      return successResponse(
        res,
        "File parsed successfully",
        {
          totalRows: rawRows.length,
          validRowsCount: validRows.length,
          invalidRowsCount: invalidRows.length,
          validRows,
          invalidRows,
        },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async importRow(req, res, next) {
    try {
      // C-6 FIX: Rate limit imports per admin user
      const userId = req.user?.id || "unknown";
      const now = Date.now();
      const entry = importCounters.get(userId);
      if (entry && now - entry.startedAt < IMPORT_WINDOW_MS) {
        if (entry.count >= MAX_IMPORTS_PER_WINDOW) {
          return errorResponse(
            res,
            `Import limit of ${MAX_IMPORTS_PER_WINDOW} rows per ${IMPORT_WINDOW_MS / 60000} minutes exceeded. Please wait.`,
            [],
            429,
          );
        }
        entry.count++;
      } else {
        importCounters.set(userId, { count: 1, startedAt: now });
      }

      const data = req.body;

      const price = parseFloat(data.price);
      const discountPercentage = parseFloat(data.discountPercentage) || 0;
      const stock = parseInt(data.stock, 10);

      const payload = {
        name: data.name,
        brand: data.brand || "FurnitureCo",
        category: data.category,
        description: data.description,
        price,
        stock,
        discountPercentage,
        active: Boolean(data.active),
        featured: Boolean(data.featured),
        trending: Boolean(data.trending),
        bestSeller: Boolean(data.bestSeller),
        newArrival: Boolean(data.newArrival),
        recommended: Boolean(data.recommended),
      };

      // Check duplicate Name + Brand
      const { default: prisma } = await import("../lib/prisma.js");
      const existingByName = await prisma.product.findFirst({
        where: {
          name: { equals: payload.name.trim(), mode: "insensitive" },
          brand: { equals: payload.brand.trim(), mode: "insensitive" },
        },
      });
      if (existingByName) {
        return successResponse(
          res,
          "A product with this name and brand already exists. Skipped.",
          { skipped: true, name: payload.name, brand: payload.brand },
          200,
        );
      }

      const { default: productService } =
        await import("../services/productService.js");
      const { default: productImageService } =
        await import("../services/productImageService.js");

      const product = await productService.createProduct(payload);

      let imagesUploaded = 0;
      try {
        if (data.primaryImage) {
          await productImageService.uploadImageUrl(
            product.id,
            data.primaryImage,
            true,
          );
          imagesUploaded++;
        }
        if (data.secondaryImage) {
          await productImageService.uploadImageUrl(
            product.id,
            data.secondaryImage,
            false,
          );
          imagesUploaded++;
        }
      } catch (imageError) {
        // Rollback: delete product if image upload fails
        await productService.deleteProduct(product.id).catch(() => {});
        throw imageError;
      }

      return successResponse(
        res,
        "Product imported successfully",
        { product, imagesUploaded },
        201,
      );
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, [], error.statusCode);
      }
      next(error);
    }
  }
}

export default new ProductController();
