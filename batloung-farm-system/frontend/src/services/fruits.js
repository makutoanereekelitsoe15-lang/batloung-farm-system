// services/fruits.js — fruit + stock API calls
import { api } from './api';

export const fruitService = {
  getAll: () => api.get('/fruits'),
  create: (data) => api.post('/fruits', data),
  update: (id, data) => api.put('/fruits/' + id, data),
};

export const stockService = {
  getAll: () => api.get('/stock'),
  getLow: () => api.get('/stock/low'),
  check: (fruitId, size) => api.get('/stock/check?fruitId=' + fruitId + '&packagingSize=' + size),
};
