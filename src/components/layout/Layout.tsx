import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Toaster } from '@/components/ui/sonner';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Sidebar />
      <div className="ml-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
};