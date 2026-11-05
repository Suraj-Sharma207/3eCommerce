import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { megaMenuData } from "./megaMenuData";

const MobileCollectionsAccordion = ({ closeMobileMenu }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-b border-border-light py-1 my-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-3 flex justify-between items-center text-base font-medium text-text-primary hover:bg-surface-background rounded-lg focus:outline-none"
      >
        Collections
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {isOpen && (
        <div className="pl-4 pr-3 py-2 space-y-4 bg-surface-background/50 rounded-lg mt-1 overflow-hidden transition-all duration-300">
          {megaMenuData.map((group) => (
            <div key={group.slug} className="mb-2">
              <Link
                to={`/products?category=${group.slug}`}
                onClick={closeMobileMenu}
                className="block text-sm text-text-brand-600 mb-2 hover:text-brand-700"
              >
                {group.category}
              </Link>
              <div className="pl-2 space-y-2 border-l-2 border-border-light">
                {group.items.map((item) => (
                  <Link
                    key={item}
                    to={`/products?category=${group.slug}`}
                    onClick={closeMobileMenu}
                    className="block text-sm text-text-secondary hover:text-brand-600 pl-2"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(MobileCollectionsAccordion);
