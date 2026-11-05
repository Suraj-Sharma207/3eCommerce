import prisma from "../lib/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { logAudit } from "../services/auditLogger.js";
import { cacheInvalidateByPattern } from "../services/cacheService.js";

class PromotionController {
  async getPromotions(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        type,
        applyTo,
        sort,
      } = req.query;

      // Safe integer clamping
      let take = parseInt(limit, 10);
      if (!Number.isFinite(take) || take < 1) take = 10;
      if (take > 50000) take = 50000;

      let currentPage = parseInt(page, 10);
      if (!Number.isFinite(currentPage) || currentPage < 1) currentPage = 1;

      let where = {};
      if (search) {
        where = {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        };
      }

      if (status && status !== "All") where.status = status;
      if (type && type !== "All") where.type = type;
      if (applyTo && applyTo !== "All") where.applyTo = applyTo;

      let orderBy = { createdAt: "desc" };
      if (sort === "oldest") orderBy = { createdAt: "asc" };
      if (sort === "discount_desc") orderBy = { discountValue: "desc" };
      if (sort === "discount_asc") orderBy = { discountValue: "asc" };

      // filteredItems = count matching current filters
      const filteredItems = await prisma.promotion.count({ where });

      // totalItems = all promotions (no filters)
      const totalItems = await prisma.promotion.count({});

      const totalPages = Math.max(1, Math.ceil(filteredItems / take));
      if (currentPage > totalPages) currentPage = totalPages;

      const skip = (currentPage - 1) * take;

      const promotions = await prisma.promotion.findMany({
        where,
        skip,
        take,
        include: {
          products: { include: { product: true } },
          categories: true,
          brands: true,
        },
        orderBy,
      });

      return successResponse(res, "Promotions fetched", {
        promotions,
        pagination: {
          currentPage,
          totalPages,
          totalItems,
          filteredItems,
          itemsPerPage: take,
          pageSize: take,
        },
      });
    } catch (error) {
      console.error("Error fetching promotions:", error);
      return errorResponse(res, "Failed to fetch promotions");
    }
  }

  async createPromotion(req, res) {
    try {
      const {
        name,
        description,
        type,
        status,
        priority,
        startDate,
        endDate,
        applyTo,
        discountValue,
        products,
        categories,
        brands,
      } = req.body;

      const data = {
        name,
        description,
        type,
        status,
        priority: parseInt(priority) || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applyTo,
        discountValue: parseFloat(discountValue) || 0,
      };

      if (applyTo === "PRODUCT" && products && products.length) {
        data.products = { create: products.map((pId) => ({ productId: pId })) };
      }
      if (applyTo === "CATEGORY" && categories && categories.length) {
        data.categories = { create: categories.map((c) => ({ category: c })) };
      }
      if (applyTo === "BRAND" && brands && brands.length) {
        data.brands = { create: brands.map((b) => ({ brand: b })) };
      }

      const promotion = await prisma.promotion.create({ data });

      await cacheInvalidateByPattern("products:*");
      await cacheInvalidateByPattern("home:*");

      await logAudit({
        adminName: req.user.name,
        section: "Promotions",
        oldValue: {},
        newValue: promotion,
        ipAddress: req.ip,
      });

      return successResponse(
        res,
        "Promotion created successfully",
        promotion,
        201,
      );
    } catch (error) {
      console.error("Error creating promotion:", error);
      return errorResponse(res, "Failed to create promotion");
    }
  }

  async updatePromotion(req, res) {
    try {
      const { id } = req.params;
      const oldPromotion = await prisma.promotion.findUnique({ where: { id } });
      if (!oldPromotion)
        return errorResponse(res, "Promotion not found", [], 404);

      const {
        name,
        description,
        type,
        status,
        priority,
        startDate,
        endDate,
        applyTo,
        discountValue,
        products,
        categories,
        brands,
      } = req.body;

      const data = {
        name,
        description,
        type,
        status,
        priority: parseInt(priority) || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applyTo,
        discountValue: parseFloat(discountValue) || 0,
      };

      // Handle relations (delete old, create new)
      if (applyTo === "PRODUCT") {
        await prisma.promotionProduct.deleteMany({
          where: { promotionId: id },
        });
        if (products && products.length)
          data.products = {
            create: products.map((pId) => ({ productId: pId })),
          };
      }
      if (applyTo === "CATEGORY") {
        await prisma.promotionCategory.deleteMany({
          where: { promotionId: id },
        });
        if (categories && categories.length)
          data.categories = {
            create: categories.map((c) => ({ category: c })),
          };
      }
      if (applyTo === "BRAND") {
        await prisma.promotionBrand.deleteMany({ where: { promotionId: id } });
        if (brands && brands.length)
          data.brands = { create: brands.map((b) => ({ brand: b })) };
      }

      const promotion = await prisma.promotion.update({ where: { id }, data });

      await cacheInvalidateByPattern("products:*");
      await cacheInvalidateByPattern("home:*");

      await logAudit({
        adminName: req.user.name,
        section: "Promotions",
        oldValue: oldPromotion,
        newValue: promotion,
        ipAddress: req.ip,
      });

      return successResponse(res, "Promotion updated successfully", promotion);
    } catch (error) {
      console.error("Error updating promotion:", error);
      return errorResponse(res, "Failed to update promotion");
    }
  }

  async deletePromotion(req, res) {
    try {
      const { id } = req.params;
      const oldPromotion = await prisma.promotion.findUnique({ where: { id } });
      if (!oldPromotion)
        return errorResponse(res, "Promotion not found", [], 404);

      await prisma.promotion.delete({ where: { id } });

      await cacheInvalidateByPattern("products:*");
      await cacheInvalidateByPattern("home:*");

      await logAudit({
        adminName: req.user.name,
        section: "Promotions",
        oldValue: oldPromotion,
        newValue: { deleted: true },
        ipAddress: req.ip,
      });

      return successResponse(res, "Promotion deleted successfully");
    } catch (error) {
      console.error("Error deleting promotion:", error);
      return errorResponse(res, "Failed to delete promotion");
    }
  }
}

export default new PromotionController();
