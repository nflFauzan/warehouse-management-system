const CustomerService = require('../services/CustomerService');

class CustomerController {
  async index(req, res) {
    try {
      const data = await CustomerService.getCustomers(req.query);
      res.render('master/customers/index', {
        title: 'Master Customer — TAKKA STEEL',
        ...data,
        search: req.query.search || '',
        currentPath: '/master/customers',
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal memuat data customer.');
      res.redirect('/');
    }
  }

  create(req, res) {
    res.render('master/customers/form', {
      title: 'Tambah Customer',
      customer: null,
      currentPath: '/master/customers'
    });
  }

  async store(req, res) {
    try {
      await CustomerService.createCustomer(req.body);
      req.flash('success', 'Customer berhasil ditambahkan.');
      res.redirect('/master/customers');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal menambah customer.');
      res.redirect('/master/customers/create');
    }
  }

  async edit(req, res) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      if (!customer) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      res.render('master/customers/form', {
        title: 'Edit Customer',
        customer,
        currentPath: '/master/customers'
      });
    } catch (err) {
      console.error(err);
      res.redirect('/master/customers');
    }
  }

  async update(req, res) {
    try {
      const result = await CustomerService.updateCustomer(req.params.id, req.body);
      if (!result) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      req.flash('success', 'Customer berhasil diperbarui.');
      res.redirect('/master/customers');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal memperbarui customer.');
      res.redirect(`/master/customers/${req.params.id}/edit`);
    }
  }

  async destroy(req, res) {
    try {
      await CustomerService.deleteCustomer(req.params.id);
      req.flash('success', 'Customer berhasil dinonaktifkan.');
      res.redirect('/master/customers');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal menghapus customer.');
      res.redirect('/master/customers');
    }
  }
}

module.exports = new CustomerController();
