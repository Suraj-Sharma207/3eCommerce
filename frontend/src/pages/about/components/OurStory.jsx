import React from'react';
import HomeSection from'../../../components/layout/HomeSection';

const OurStory = () => {
 return (
 <HomeSection title="Our Story">
 <div className="grid md:grid-cols-2 gap-12 items-center">
 <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface-background">
 <img 
 src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
 alt="Our Workshop" 
 className="w-full h-full object-cover"
 />
 </div>
 <div>
 <h3 className="text-2xl font-bold text-text-primary mb-4">From a Small Workshop to Your Home</h3>
 <p className="text-text-secondary mb-6 leading-relaxed">
 Founded with a passion for quality craftsmanship, our journey began in a small workshop where every piece was meticulously crafted by hand. Today, while we have grown, our commitment to detail, durability, and design remains unchanged.
 </p>
 <p className="text-text-secondary leading-relaxed">
 We partner with skilled artisans and sustainable suppliers to ensure that every furniture piece not only looks beautiful but stands the test of time, making your house truly feel like a home.
 </p>
 </div>
 </div>
 </HomeSection>
 );
};

export default OurStory;
