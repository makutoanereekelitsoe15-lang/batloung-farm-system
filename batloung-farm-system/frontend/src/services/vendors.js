// services/vendors.js — vendor API calls (search included)
import { api } from './api';

export const vendorService = {
  getAll: (search) => api.get('/vendors' + (search ? '?search=' + encodeURIComponent(search) : '')),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put('/vendors/' + id, data),
};
