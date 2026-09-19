import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ErrorBoundary from '../UI/ErrorBoundary';
import PageSkeleton from '../UI/PageSkeleton';

export default function AppShell() {
  return (
    <div className="app-shell">
      <TopBar />
      <Sidebar />
      <main className="main-content">
        <div className="page-scroll">
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
