import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col w-full pt-20">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default PublicLayout;
