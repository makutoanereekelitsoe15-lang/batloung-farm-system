// services/reports.js — the four reports + dashboard
import { api } from './api';

export const reportService = {
  dashboard: () => api.get('/dashboard'),
  topFruits: () => api.get('/reports/top-fruits'),
  revenue: (startDate, endDate) =>
    api.get('/reports/revenue?startDate=' + startDate + '&endDate=' + endDate),
  topVendor: () => api.get('/reports/top-vendor'),
  stock: () => api.get('/reports/stock'),
};
