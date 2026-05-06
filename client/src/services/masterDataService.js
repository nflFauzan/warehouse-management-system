import api from './api';

export const categoryService = {
  getAll: () => api.get('/categories').then(res => res.data),
  getById: (id) => api.get(`/categories/${id}`).then(res => res.data),
  create: (data) => api.post('/categories', data).then(res => res.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/categories/${id}`).then(res => res.data)
};

export const unitService = {
  getAll: () => api.get('/units').then(res => res.data),
  getById: (id) => api.get(`/units/${id}`).then(res => res.data),
  create: (data) => api.post('/units', data).then(res => res.data),
  update: (id, data) => api.put(`/units/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/units/${id}`).then(res => res.data)
};

export const supplierService = {
  getAll: (params) => api.get('/suppliers', { params }).then(res => res.data),
  getById: (id) => api.get(`/suppliers/${id}`).then(res => res.data),
  create: (data) => api.post('/suppliers', data).then(res => res.data),
  update: (id, data) => api.put(`/suppliers/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/suppliers/${id}`).then(res => res.data)
};

export const customerService = {
  getAll: (params) => api.get('/customers', { params }).then(res => res.data),
  getById: (id) => api.get(`/customers/${id}`).then(res => res.data),
  create: (data) => api.post('/customers', data).then(res => res.data),
  update: (id, data) => api.put(`/customers/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/customers/${id}`).then(res => res.data)
};

export const itemService = {
  getAll: (params) => api.get('/items', { params }).then(res => res.data),
  getById: (id) => api.get(`/items/${id}`).then(res => res.data),
  getFormData: () => api.get('/items/form-data').then(res => res.data),
  create: (data) => api.post('/items', data).then(res => res.data),
  update: (id, data) => api.put(`/items/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/items/${id}`).then(res => res.data)
};

export const userService = {
  getAll: () => api.get('/users').then(res => res.data),
  getById: (id) => api.get(`/users/${id}`).then(res => res.data),
  create: (data) => api.post('/users', data).then(res => res.data),
  update: (id, data) => api.put(`/users/${id}`, data).then(res => res.data),
};
