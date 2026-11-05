import React, { useEffect, useState } from "react";
import api from "../../../services/api";

const SaleHero = () => {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveBanner = async () => {
      try {
        const response = await api.get("/sale-banner");
        if (response.data && response.data.success) {
          setBanner(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch active sale banner:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveBanner();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="w-full h-[140px] sm:h-[180px] md:h-[220px] lg:h-[260px] bg-slate-200 animate-pulse rounded-[32px]" />
      </div>
    );
  }

  const imageUrl = banner ? banner.image : "/images/sale_banner.png";

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="relative rounded-[32px] overflow-hidden border border-[#E3D8C8] shadow-sm w-full">
        <img
          src={imageUrl}
          alt="The Grand Sale Banner"
          className="w-full h-auto block select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default SaleHero;
