import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart,
  BookOpen,
  MessageSquare,
  Terminal,
  Settings,
} from "lucide-react";

const AdminAILayout = () => {
  const navItems = [
    { name: "Overview", path: "/admin/ai/dashboard", icon: BarChart },
    { name: "Knowledge Base", path: "/admin/ai/knowledge", icon: BookOpen },
    {
      name: "Conversations",
      path: "/admin/ai/conversations",
      icon: MessageSquare,
    },
    { name: "Playground", path: "/admin/ai/playground", icon: Terminal },
    { name: "Settings", path: "/admin/ai/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Top Navigation for AI Module */}
      <div className="bg-gray-50 border-b border-border p-4 flex gap-4 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                ${
                  isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          );
        })}
      </div>

      {/* Sub-page Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminAILayout;
