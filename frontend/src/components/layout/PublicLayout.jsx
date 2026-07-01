import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingCartBar from '../FloatingCartBar';

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col w-full pt-20 pb-[80px]">
        <Outlet />
      </main>
      <Footer />
      <FloatingCartBar />
    </>
  );
};

export default PublicLayout;
