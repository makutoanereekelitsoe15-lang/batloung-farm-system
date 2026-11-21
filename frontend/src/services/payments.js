// services/payments.js — payment API calls
import { api } from './api';

export const paymentService = {
  getAll: () => api.get('/payments'),
  getOutstanding: () => api.get('/payments/outstanding'),
  getForSale: (saleId) => api.get('/payments/sale/' + saleId),
  create: (data) => api.post('/payments', data),
};
