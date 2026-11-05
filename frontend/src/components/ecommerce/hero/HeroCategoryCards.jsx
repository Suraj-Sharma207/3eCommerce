import React from "react";
import { heroCategoryCards } from "./heroData";

/**
 * HeroCategoryCards — shows category thumbnail cards below the carousel.
 * Clicking a card switches the carousel to the corresponding slide.
 * Props:
 * cards: category card data (defaults to heroCategoryCards)
 * activeIndex: currently active slide index (used to highlight active card)
 * onCardClick: (slideIndex) => void
 */
const HeroCategoryCards = ({
  cards = heroCategoryCards,
  activeIndex,
  onCardClick,
}) => {
  return (
    <div
      className="flex overflow-x-auto hide-scrollbar sm:grid sm:grid-cols-5 gap-3 sm:gap-4"
      role="list"
      aria-label="Browse by room category"
    >
      {cards.map((card) => {
        const isActive = activeIndex === card.slideIndex;
        return (
          <button
            key={card.id}
            role="listitem"
            onClick={() => onCardClick?.(card.slideIndex)}
            aria-label={`Browse ${card.label}`}
            aria-pressed={isActive}
            className={`
 relative flex-shrink-0 w-40 sm:w-auto aspect-[4/3] rounded-xl overflow-hidden
 focus:outline-none focus:ring-2 focus:ring-brand-400
 transition-all duration-200 group
 ${isActive ? "ring-2 ring-brand-600 ring-offset-2" : "ring-0"}
`}
          >
            {/* Background image */}
            <img
              src={card.image}
              alt={card.label}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />

            {/* Dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <span className="text-white text-sm sm:text-[13px] tracking-wide drop-shadow">
                {card.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default HeroCategoryCards;
