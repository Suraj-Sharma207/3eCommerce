import React, { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import MegaMenuColumn from './MegaMenuColumn';
import { megaMenuData } from './megaMenuData';

const MegaMenu = ({ isOpen, setIsOpen }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const topRow = megaMenuData.slice(0, 4);
  const bottomRow = megaMenuData.slice(4, 8);

  return (
    <div 
      ref={containerRef}
      className="flex items-center h-full"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className={`hover:text-brand-600 transition-colors flex items-center gap-1 font-medium focus:outline-none ${isOpen ? 'text-brand-600' : 'text-text-secondary'}`}
        aria-expanded={isOpen}
      >
        Collections 
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Mega Menu Dropdown */}
      <div 
        className={`absolute top-full left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-[1200px] bg-white rounded-2xl shadow-2xl border border-border-light p-6 lg:p-8 z-50 mt-1 transition-all duration-300 transform origin-top ${isOpen ? 'opacity-100 scale-y-100 translate-y-0 visible' : 'opacity-0 scale-y-95 -translate-y-2 invisible'}`}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {topRow.map(group => (
            <MegaMenuColumn key={group.slug} group={group} onClose={() => setIsOpen(false)} />
          ))}
        </div>
        
        <hr className="my-6 lg:my-8 border-border-light" />
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {bottomRow.map(group => (
            <MegaMenuColumn key={group.slug} group={group} onClose={() => setIsOpen(false)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MegaMenu);
