import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CategoryItem = ({ category, isActive }) => {
  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.name)}`}
      className="relative px-4 py-3 group whitespace-nowrap outline-none flex items-center h-full"
    >
      <span
        className={`text-sm font-medium transition-colors duration-200 ${
          isActive
            ? "text-brand-600"
            : "text-text-secondary group-hover:text-brand-600 group-focus-visible:text-brand-600"
        }`}
      >
        {category.name}
      </span>
      {isActive && (
        <motion.div
          layoutId="activeCategory"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t-full"
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className="absolute inset-0 rounded-md ring-2 ring-brand-500 opacity-0 group-focus-visible:opacity-100 transition-opacity" />
    </Link>
  );
};

export default CategoryItem;
