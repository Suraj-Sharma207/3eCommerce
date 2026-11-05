import orderService from "../services/orderService.js";
import { successResponse } from "../utils/response.js";

class OrderController {
  async checkout(req, res, next) {
    try {
      const {
        shippingAddressId,
        billingAddressId,
        paymentMethod,
        paymentDetails,
        deliveryMethod,
      } = req.body;

      if (!["UPI", "CREDIT_CARD", "COD"].includes(paymentMethod)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment method" });
      }

      // Backend Validation for payment methods
      if (paymentMethod === "UPI") {
        const { upiProvider, upiId } = paymentDetails || {};
        if (!upiProvider) {
          return res
            .status(400)
            .json({ success: false, message: "UPI Provider is required" });
        }
        if (upiProvider === "OTHER") {
          if (!upiId || !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
            return res
              .status(400)
              .json({ success: false, message: "Invalid UPI ID format" });
          }
        }
      } else if (paymentMethod === "CREDIT_CARD") {
        const { cardNumber, nameOnCard, expiry, cvc } = paymentDetails || {};

        if (!nameOnCard || !/^[A-Za-z\s]{2,80}$/.test(nameOnCard)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid card holder name" });
        }

        const cleanCardNumber = cardNumber?.replace(/\s/g, "");
        if (!cleanCardNumber || !/^\d{13,19}$/.test(cleanCardNumber)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid card number" });
        }

        // Luhn Algorithm validation
        let sum = 0;
        let isEven = false;
        for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
          let digit = parseInt(cleanCardNumber.charAt(i), 10);
          if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          sum += digit;
          isEven = !isEven;
        }
        if (sum % 10 !== 0) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Invalid card number (failed checksum)",
            });
        }

        if (!expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Invalid expiry date format (MM/YY)",
            });
        }

        const [month, year] = expiry.split("/");
        const expiryDate = new Date(`20${year}`, month - 1);
        const today = new Date();
        today.setDate(1);
        today.setHours(0, 0, 0, 0);
        if (expiryDate < today) {
          return res
            .status(400)
            .json({ success: false, message: "Card has expired" });
        }

        if (!cvc || !/^\d{3,4}$/.test(cvc)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid CVC" });
        }
      }

      // Create safe payment metadata
      const paymentMetadata = {
        paymentMethod,
        transactionRef: `TXN-${Date.now()}`,
        cardBrand: paymentMethod === "CREDIT_CARD" ? "Card" : null,
        last4Digits:
          paymentMethod === "CREDIT_CARD" && paymentDetails?.cardNumber
            ? paymentDetails.cardNumber.slice(-4)
            : null,
        maskedUPI: paymentMethod === "UPI" ? paymentDetails?.upiId : null,
      };

      const order = await orderService.checkout(req.user.id, {
        shippingAddressId,
        billingAddressId,
        paymentMethod,
        paymentMetadata,
        deliveryMethod,
      });
      return successResponse(res, "Order placed successfully", order, 201);
    } catch (error) {
      if (error.status) {
        return res
          .status(error.status)
          .json({ success: false, message: error.message });
      }
      console.error("Checkout Error:", error);
      next(error);
    }
  }

  async getUserOrders(req, res, next) {
    try {
      const orders = await orderService.getUserOrders(req.user.id);
      return successResponse(res, "Orders retrieved successfully", orders, 200);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id, req.user.id);
      return successResponse(res, "Order retrieved successfully", order, 200);
    } catch (error) {
      next(error);
    }
  }

  // Admin Routes Below
  async getAllOrders(req, res, next) {
    try {
      const {
        page,
        limit,
        search,
        status,
        paymentStatus,
        minDate,
        maxDate,
        minAmount,
        maxAmount,
        sort,
      } = req.query;
      const data = await orderService.getAllOrders({
        page,
        limit,
        search,
        status,
        paymentStatus,
        minDate,
        maxDate,
        minAmount,
        maxAmount,
        sort,
      });
      return successResponse(res, "All orders retrieved", data, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(id, status);
      return successResponse(res, "Order status updated", order, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
