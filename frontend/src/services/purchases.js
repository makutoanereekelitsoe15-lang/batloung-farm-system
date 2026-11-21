// services/purchases.js — purchase API calls
import { api } from './api';

export const purchaseService = {
  getAll: () => api.get('/purchases'),
  getOne: (id) => api.get('/purchases/' + id),
  create: (data) => api.post('/purchases', data),
  cancel: (id) => api.put('/purchases/' + id + '/cancel', {}),
};
