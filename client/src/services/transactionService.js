import api from './api';

export const stockInService = {
  getAll: (params) => api.get('/stock-in', { params }).then(res => res.data),
  getFormData: () => api.get('/stock-in/form-data').then(res => res.data),
  getById: (id) => api.get(`/stock-in/${id}`).then(res => res.data),
  create: (data) => api.post('/stock-in', data).then(res => res.data),
  confirm: (id) => api.post(`/stock-in/${id}/confirm`).then(res => res.data)
};

export const stockOutService = {
  getAll: (params) => api.get('/stock-out', { params }).then(res => res.data),
  getFormData: () => api.get('/stock-out/form-data').then(res => res.data),
  getById: (id) => api.get(`/stock-out/${id}`).then(res => res.data),
  create: (data) => api.post('/stock-out', data).then(res => res.data),
  confirm: (id) => api.post(`/stock-out/${id}/confirm`).then(res => res.data)
};

export const stockPositionService = {
  get: (params) => api.get('/stock', { params }).then(res => res.data),
  getHistory: (id, params) => api.get(`/stock/${id}/history`, { params }).then(res => res.data)
};
