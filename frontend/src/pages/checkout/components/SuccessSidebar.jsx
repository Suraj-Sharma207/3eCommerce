import React from "react";
import AddressCard from "./AddressCard";
import PaymentCard from "./PaymentCard";
import { Package, MessageCircle, Mail } from "lucide-react";
import { useBrandingStore } from "../../../store/brandingStore";

const SuccessSidebar = ({ order }) => {
  const { branding } = useBrandingStore();
  const supportEmail =
    branding?.supportEmail ||
    `support@${(branding?.platformName || "luxehome").toLowerCase().replace(/\s+/g, "")}.com`;
  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 delay-400">
      <AddressCard address={order.shippingAddress} />

      <PaymentCard order={order} />

      {/* Delivery Estimate Card */}
      <div className="bg-white rounded-[20px] shadow-sm border border-border-light p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center">
            <Package className="w-4 h-4 text-success-600" />
          </div>
          <h3 className="font-bold text-text-brand-700 text-sm">
            Delivery Estimate
          </h3>
        </div>
        <p className="text-text-brand-700 ml-11">2 - 4 Business Days</p>
      </div>

      {/* Email Confirmation Card */}
      <div className="bg-white rounded-[20px] shadow-sm border border-border-light p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
            <Mail className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h3 className="font-bold text-text-brand-700 text-sm">
              Confirmation Email
            </h3>
            <p className="text-xs text-success-600 flex items-center mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 mr-1.5"></span>
              Sent successfully
            </p>
          </div>
        </div>
      </div>

      {/* Need Help Card */}
      <div className="bg-surface-background rounded-[20px] border border-border-light p-6 text-center">
        <h3 className="font-bold text-text-brand-700 text-sm mb-2">
          Need Help?
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Our support team is here to assist you with your order.
        </p>
        <div className="flex justify-center gap-3 text-sm">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-text-brand-700">
            <MessageCircle className="w-4 h-4 mr-2 text-brand-600" />
            Chat
          </button>
          <a
            href={`mailto:${supportEmail}`}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-text-brand-700"
          >
            <Mail className="w-4 h-4 mr-2 text-brand-600" />
            Email
          </a>
        </div>
      </div>
    </div>
  );
};

export default SuccessSidebar;
