import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background-default font-sans flex flex-col">
      {/* Optional minimal header if needed */}
      <header className="p-4 sm:px-6 lg:px-12 absolute top-0 w-full z-10 flex justify-between items-center">
        <Link to="/" className="text-2xl font-extrabold text-primary-600 tracking-tight">
          LuxeHome
        </Link>
      </header>
      
      <main className="flex-1 flex">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
