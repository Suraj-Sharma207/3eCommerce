import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useOrderStore from "../../store/orderStore";
import {
  ChevronLeft,
  Truck,
  Package,
  CreditCard,
  CheckCircle2,
  Circle,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import EmptyState from "../../components/ui/EmptyState";
import ImageFallback from "../../components/ui/ImageFallback";
import { getOptimizedUrl } from "../../utils/cloudinary";
import { formatPrice } from "../../utils/currency";

const OrderDetailPage = () => {
  const { id } = useParams();
  const { fetchOrderById, currentOrder } = useOrderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (id) {
        await fetchOrderById(id);
        setLoading(false);
      }
    };
    loadOrder();
  }, [id, fetchOrderById]);

  if (loading)
    return (
      <div className="p-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (!currentOrder)
    return (
      <div className="p-12 flex justify-center text-text-muted font-medium">
        Order not found
      </div>
    );

  const orderStatuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];
  const currentStatusIndex = orderStatuses.indexOf(currentOrder.orderStatus);

  const renderTimeline = () => {
    const timelineSteps = [
      {
        status: "CONFIRMED",
        label: "Order Confirmed",
        description: "Your order is confirmed",
      },
      {
        status: "PROCESSING",
        label: "Processing",
        description: "Your order is being processed",
      },
      {
        status: "PACKED",
        label: "Packed",
        description: "Your order is packed",
      },
      {
        status: "SHIPPED",
        label: "Shipped",
        description: "Your order is on the way",
      },
      {
        status: "DELIVERED",
        label: "Delivered",
        description: "Your order has been delivered",
      },
    ];

    let currentIndex = timelineSteps.findIndex(
      (s) => s.status === currentOrder.orderStatus,
    );
    if (currentIndex === -1)
      currentIndex = currentOrder.orderStatus === "CANCELLED" ? -1 : 0;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8 mb-8">
        <h2 className="text-xl text-text-primary mb-8 font-bold">
          Order Status
        </h2>

        {currentOrder.orderStatus === "CANCELLED" ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            <h3 className="text-lg mb-1 font-bold">Order Cancelled</h3>
            <p className="text-sm">
              This order has been cancelled and will not be delivered.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-neutral-200 md:left-1/2 md:-translate-x-1/2 md:top-[19px] md:bottom-auto md:w-full md:h-0.5 md:right-4"></div>
            <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
              {timelineSteps.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                return (
                  <div
                    key={step.status}
                    className={`flex md:flex-col items-center gap-4 md:gap-3 flex-1 ${index > currentIndex ? "opacity-50" : ""}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white border-2 transition-colors ${
                        isCompleted
                          ? "border-brand-600 text-brand-600"
                          : "border-neutral-300 text-neutral-300"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 bg-brand-600 text-white rounded-full" />
                      ) : (
                        <Circle className="w-3 h-3 fill-current" />
                      )}
                    </div>
                    <div className="md:text-center">
                      <p
                        className={`font-medium ${isCurrent ? "text-brand-700" : "text-text-primary"}`}
                      >
                        {step.label}
                      </p>
                      <p className="text-sm text-text-muted hidden sm:block font-medium">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <PageContainer className="py-8 lg:py-12 max-w-5xl">
      <Link
        to="/orders"
        className="inline-flex items-center text-sm font-medium text-text-muted hover:text-text-primary mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl text-text-primary mb-2 font-bold">
            Order {currentOrder.orderNumber}
          </h1>
          <p className="text-text-muted font-medium">
            Placed on {new Date(currentOrder.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {renderTimeline()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border-light">
              <h2 className="text-lg text-text-primary flex items-center gap-2 font-bold">
                <Package className="w-5 h-5 text-text-muted font-medium" />{" "}
                Items in this Order
              </h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {currentOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="p-6 flex gap-6 items-center hover:bg-surface-background transition-colors"
                >
                  <Link
                    to={`/products/${item.productId}`}
                    className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-border-light"
                  >
                    <ImageFallback
                      src={getOptimizedUrl(item.product.thumbnail, "thumbnail")}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      className="text-base text-text-primary hover:text-brand-600 transition-colors line-clamp-1 mb-1"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-text-muted mb-2 font-medium">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Addresses */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
            <h2 className="text-lg text-text-primary mb-6 pb-4 border-b border-border-light flex items-center gap-2 font-bold">
              <CreditCard className="w-5 h-5 text-text-muted font-medium" />{" "}
              Order Summary
            </h2>

            <div className="space-y-4 text-sm text-text-secondary mb-6">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="text-text-primary">
                  {formatPrice(currentOrder.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  Shipping{" "}
                  {currentOrder.deliveryMethod === "express" ? "(Express)" : ""}
                </span>
                <span className="text-text-primary">
                  {currentOrder.shippingCharge === 0
                    ? "Free"
                    : formatPrice(currentOrder.shippingCharge)}
                </span>
              </div>
            </div>

            <div className="border-t border-border-light pt-4 flex justify-between items-center">
              <span className="text-base text-text-primary">Grand Total</span>
              <span className="text-xl text-text-primary">
                {formatPrice(currentOrder.totalAmount)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
            <h2 className="text-lg text-text-primary mb-6 pb-4 border-b border-border-light flex items-center gap-2 font-bold">
              <Truck className="w-5 h-5 text-text-muted font-medium" /> Shipping
              Details
            </h2>

            {currentOrder.shippingAddress ? (
              <div className="text-sm text-text-secondary space-y-1">
                <p className="text-text-primary">
                  {currentOrder.shippingAddress.recipientName || "Name missing"}
                </p>
                <p>{currentOrder.shippingAddress.street || "Street missing"}</p>
                <p>
                  {currentOrder.shippingAddress.city || "City missing"},{" "}
                  {currentOrder.shippingAddress.state || "State missing"}{" "}
                  {currentOrder.shippingAddress.zipCode || "Zip missing"}
                </p>
                <p>
                  {currentOrder.shippingAddress.country || "Country missing"}
                </p>
                <div className="mt-4 pt-3 border-t border-border-light space-y-1">
                  <p className="flex justify-between">
                    <span className="text-text-muted font-medium">Method:</span>{" "}
                    <span className="text-text-primary capitalize">
                      {currentOrder.deliveryMethod === "express"
                        ? "Express Delivery"
                        : "Standard Delivery"}
                    </span>
                  </p>
                  {currentOrder.estimatedDelivery && (
                    <p className="flex justify-between">
                      <span className="text-text-muted font-medium">
                        Estimated:
                      </span>{" "}
                      <span className="text-text-primary">
                        {currentOrder.estimatedDelivery}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted font-medium">
                Shipping details unavailable.
              </p>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default OrderDetailPage;
