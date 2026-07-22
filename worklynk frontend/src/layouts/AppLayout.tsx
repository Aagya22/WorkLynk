import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';


export const AppLayout: React.FC = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);
