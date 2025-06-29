import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { ProfileCreation } from '@/components/ProfileCreation';
import { Dashboard } from '@/pages/Dashboard';
import { Search } from '@/pages/Search';
import { Watchlist } from '@/pages/Watchlist';
import { Statistics } from '@/pages/Statistics';
import { Settings } from '@/pages/Settings';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const AppRouter: React.FC = () => {
  const { user, isLoading, needsProfileCreation } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Show profile creation if no profiles exist
  if (needsProfileCreation) {
    return <ProfileCreation />;
  }

  // If we have profiles but no active user, redirect to dashboard (shouldn't happen)
  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Layout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="search" element={<Search />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRouter />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;