import React from 'react';
import HomeSection from '../../../components/layout/HomeSection';

const Timeline = () => {
  const events = [
    { year: "2015", title: "The Beginning", description: "Started in a small garage with just 3 craftsmen and a big dream." },
    { year: "2018", title: "First Retail Store", description: "Opened our flagship store in the heart of the city." },
    { year: "2020", title: "Going Digital", description: "Launched our online platform to reach homes nationwide." },
    { year: "2023", title: "Sustainable Shift", description: "Achieved 100% sustainable sourcing for all wood materials." }
  ];

  return (
    <HomeSection title="Our Journey" subtitle="Milestones that defined us">
      <div className="relative border-l-2 border-brand-200 ml-4 md:ml-0 md:pl-0">
        {events.map((event, index) => (
          <div key={index} className="mb-10 ml-8 md:ml-0 relative">
            <div className="absolute -left-[41px] md:left-1/2 md:-ml-[11px] top-1 w-5 h-5 rounded-full bg-brand-600 border-4 border-white shadow"></div>
            
            <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'}`}>
              <div className="bg-white p-6 rounded-xl border border-border-light shadow-sm">
                <span className="text-brand-600 font-bold text-lg mb-1 block">{event.year}</span>
                <h4 className="text-xl font-bold text-text-primary mb-2">{event.title}</h4>
                <p className="text-text-secondary">{event.description}</p>
              </div>
            </div>
          </div>
        ))}
        {/* Invisible div to fix line layout on desktop */}
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-0.5 bg-brand-200 -ml-[1px] -z-10"></div>
      </div>
    </HomeSection>
  );
};

export default Timeline;
