import React from 'react';
import HomeSection from '../../../components/layout/HomeSection';
import { Leaf, Shield, Heart } from 'lucide-react';

const MissionCards = () => {
  const cards = [
    {
      icon: <Leaf className="w-8 h-8 text-brand-600 font-normal" />,
      title: "Sustainable Practices",
      description: "We are committed to eco-friendly sourcing and production to minimize our environmental footprint."
    },
    {
      icon: <Shield className="w-8 h-8 text-brand-600 font-normal" />,
      title: "Uncompromising Quality",
      description: "Premium materials and rigorous quality checks ensure our furniture lasts for generations."
    },
    {
      icon: <Heart className="w-8 h-8 text-brand-600 font-normal" />,
      title: "Customer First",
      description: "Your satisfaction is our priority. We offer dedicated support and seamless shopping experiences."
    }
  ];

  return (
    <HomeSection title="Our Core Values" subtitle="What drives us every day">
      <div className="grid md:grid-cols-3 gap-8 font-normal">
        {cards.map((card, index) => (
          <div key={index} className="bg-white p-8 rounded-2xl border border-border-light shadow-sm hover:shadow-md transition-shadow font-normal">
            <div className="w-16 h-16 bg-brand-50 rounded-xl flex items-center justify-center mb-6 font-normal">
              {card.icon}
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-3">{card.title}</h3>
            <p className="text-text-secondary font-normal">{card.description}</p>
          </div>
        ))}
      </div>
    </HomeSection>
  );
};

export default MissionCards;
