import addressService from "../services/addressService.js";
import { successResponse, errorResponse } from "../utils/response.js";

class AddressController {
  async getUserAddresses(req, res, next) {
    try {
      const addresses = await addressService.getUserAddresses(req.user.id);
      return successResponse(
        res,
        "Addresses retrieved successfully",
        { addresses },
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req, res, next) {
    try {
      const newAddress = await addressService.createAddress(
        req.user.id,
        req.body,
      );
      return successResponse(
        res,
        "Address created successfully",
        { address: newAddress },
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req, res, next) {
    try {
      const updatedAddress = await addressService.updateAddress(
        req.user.id,
        req.params.id,
        req.body,
      );
      return successResponse(
        res,
        "Address updated successfully",
        { address: updatedAddress },
        200,
      );
    } catch (error) {
      if (error.message === "Address not found or unauthorized") {
        return errorResponse(res, error.message, [], 403);
      }
      next(error);
    }
  }

  async deleteAddress(req, res, next) {
    try {
      await addressService.deleteAddress(req.user.id, req.params.id);
      return successResponse(res, "Address deleted successfully", {}, 200);
    } catch (error) {
      if (error.message === "Address not found or unauthorized") {
        return errorResponse(res, error.message, [], 403);
      }
      next(error);
    }
  }
}

export default new AddressController();
