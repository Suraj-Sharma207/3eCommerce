import React from 'react';
import HomeSection from '../../../components/layout/HomeSection';
import { Star } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Jenkins",
      role: "Interior Designer",
      content: "The quality of craftsmanship is simply outstanding. I constantly recommend these pieces to my clients. They offer the perfect balance of modern design and timeless elegance.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Homeowner",
      content: "From the browsing experience to delivery, everything was seamless. The sofa we purchased is the centerpiece of our living room and we couldn't be happier.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Architect",
      content: "Finding furniture that respects sustainable practices without compromising on durability used to be a challenge. Now, this is my go-to store for all my projects.",
      rating: 5
    }
  ];

  return (
    <HomeSection title="What Our Customers Say" subtitle="Don't just take our word for it">
      <div className="grid md:grid-cols-3 gap-8 font-normal">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="bg-surface-background p-8 rounded-2xl font-normal">
            <div className="flex gap-1 mb-4 font-normal">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-warning-400 text-warning-400 font-normal" />
              ))}
            </div>
            <p className="text-text-secondary italic mb-6 font-normal">"{testimonial.content}"</p>
            <div>
              <div className="text-text-primary font-normal">{testimonial.name}</div>
              <div className="text-sm text-text-muted font-medium">{testimonial.role}</div>
            </div>
          </div>
        ))}
      </div>
    </HomeSection>
  );
};

export default Testimonials;
