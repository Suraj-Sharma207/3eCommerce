import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Placeholder components
const Home = () => <div className="p-8 text-center text-2xl font-bold text-primary-600">Welcome to eCommerce App</div>;
const Login = () => <div className="p-8">Login Page</div>;
const Register = () => <div className="p-8">Register Page</div>;
const Dashboard = () => <div className="p-8">Admin Dashboard</div>;

const AppRoutes = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar Placeholder */}
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">eCommerce</h1>
          <div className="space-x-4">
            <a href="/" className="text-secondary-600 hover:text-primary-600">Home</a>
            <a href="/login" className="text-secondary-600 hover:text-primary-600">Login</a>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin routes - protected placeholders */}
          <Route path="/admin/dashboard" element={<Dashboard />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer Placeholder */}
      <footer className="bg-secondary-800 text-white p-6 mt-auto">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} eCommerce App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AppRoutes;
