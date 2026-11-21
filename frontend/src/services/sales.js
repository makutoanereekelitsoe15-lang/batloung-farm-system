// services/sales.js — sale API calls
import { api } from './api';

export const saleService = {
  getAll: (status) => api.get('/sales' + (status ? '?status=' + status : '')),
  getOne: (id) => api.get('/sales/' + id),
  create: (data) => api.post('/sales', data),
};
