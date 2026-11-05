import React, { useEffect } from "react";
import AboutHero from "./components/AboutHero";
import OurStory from "./components/OurStory";
import MissionCards from "./components/MissionCards";
import Timeline from "./components/Timeline";
import Stats from "./components/Stats";
import Testimonials from "./components/Testimonials";
import BrandGrid from "./components/BrandGrid";
import FAQ from "./components/FAQ";
import AboutCTA from "./components/AboutCTA";

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-surface-background">
      <AboutHero />
      <OurStory />
      <Stats />
      <MissionCards />
      <Timeline />
      <Testimonials />
      <BrandGrid />
      <FAQ />
      <AboutCTA />
    </div>
  );
};

export default AboutPage;
