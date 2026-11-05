import React, { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Settings,
  Store,
  CreditCard,
  Mail,
  Shield,
  Bell,
  FileText,
  Truck,
  Image as ImageIcon,
} from "lucide-react";

import BrandingTab from "./settings/BrandingTab";
import StoreTab from "./settings/StoreTab";
import ShippingTab from "./settings/ShippingTab";
import PaymentTab from "./settings/PaymentTab";
import SmtpTab from "./settings/SmtpTab";
import SecurityTab from "./settings/SecurityTab";
import ActiveSessionsTab from "./settings/ActiveSessionsTab";
import NotificationsTab from "./settings/NotificationsTab";
import AuditLogsTab from "./settings/AuditLogsTab";
import AdminSaleBanner from "./AdminSaleBanner";
import AdminShopBanner from "./AdminShopBanner";

const VALID_TABS = [
  "branding",
  "store",
  "shipping",
  "payment",
  "email",
  "security",
  "active-sessions",
  "notifications",
  "audit",
  "sale-banner",
  "shop-banner",
];

const AdminSettings = () => {
  const { tab } = useParams();
  const navigate = useNavigate();

  const activeTab = tab && VALID_TABS.includes(tab) ? tab : "branding";

  const handleTabChange = useCallback(
    (tabId) => {
      navigate(`/admin/settings/${tabId}`);
    },
    [navigate],
  );

  const tabs = [
    {
      id: "branding",
      label: "Branding",
      icon: <ImageIcon className="w-4 h-4 mr-2" />,
      component: <BrandingTab />,
    },
    {
      id: "store",
      label: "Store",
      icon: <Store className="w-4 h-4 mr-2" />,
      component: <StoreTab />,
    },
    {
      id: "shipping",
      label: "Shipping",
      icon: <Truck className="w-4 h-4 mr-2" />,
      component: <ShippingTab />,
    },
    {
      id: "payment",
      label: "Payment & Tax",
      icon: <CreditCard className="w-4 h-4 mr-2" />,
      component: <PaymentTab />,
    },
    {
      id: "email",
      label: "Email (SMTP)",
      icon: <Mail className="w-4 h-4 mr-2" />,
      component: <SmtpTab />,
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="w-4 h-4 mr-2" />,
      component: <SecurityTab />,
    },
    {
      id: "active-sessions",
      label: "Active Sessions",
      icon: <Shield className="w-4 h-4 mr-2" />,
      component: <ActiveSessionsTab />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-4 h-4 mr-2" />,
      component: <NotificationsTab />,
    },
    {
      id: "audit",
      label: "Audit Logs",
      icon: <FileText className="w-4 h-4 mr-2" />,
      component: <AuditLogsTab />,
    },
    {
      id: "sale-banner",
      label: "Sale Banner",
      icon: <ImageIcon className="w-4 h-4 mr-2" />,
      component: <AdminSaleBanner />,
    },
    {
      id: "shop-banner",
      label: "Shop Banner",
      icon: <ImageIcon className="w-4 h-4 mr-2" />,
      component: <AdminShopBanner />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl text-text-brand-600 flex items-center gap-2 font-bold">
          <Settings className="w-6 h-6" />
          System Settings
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-surface-background border-b md:border-b-0 md:border-r border-border p-4 space-y-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-text-secondary hover:bg-border-light hover:text-text-primary"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto relative bg-white">
          <div
            className={
              activeTab === "sale-banner" || activeTab === "shop-banner"
                ? "max-w-none"
                : "max-w-3xl"
            }
          >
            {tabs.find((t) => t.id === activeTab)?.component}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
