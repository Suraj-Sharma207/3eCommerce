import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingCartBar from '../FloatingCartBar';
import CookieBanner from '../cookies/CookieBanner';
import CookiePreferencesModal from '../cookies/CookiePreferencesModal';

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col w-full pt-20 font-normal">
        <Outlet />
      </main>
      <Footer />
      <FloatingCartBar />
      <CookieBanner />
      <CookiePreferencesModal />
    </>
  );
};

export default PublicLayout;
