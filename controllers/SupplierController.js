const SupplierService = require('../services/SupplierService');

class SupplierController {
  async index(req, res) {
    try {
      const data = await SupplierService.getSuppliers(req.query);
      res.render('master/suppliers/index', {
        title: 'Master Supplier — TAKKA STEEL',
        ...data,
        search: req.query.search || '',
        currentPath: '/master/suppliers',
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal memuat data supplier.');
      res.redirect('/');
    }
  }

  create(req, res) {
    res.render('master/suppliers/form', {
      title: 'Tambah Supplier',
      supplier: null,
      currentPath: '/master/suppliers'
    });
  }

  async store(req, res) {
    try {
      await SupplierService.createSupplier(req.body);
      req.flash('success', 'Supplier berhasil ditambahkan.');
      res.redirect('/master/suppliers');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal menambah supplier.');
      res.redirect('/master/suppliers/create');
    }
  }

  async edit(req, res) {
    try {
      const supplier = await SupplierService.getSupplierById(req.params.id);
      if (!supplier) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      res.render('master/suppliers/form', {
        title: 'Edit Supplier',
        supplier,
        currentPath: '/master/suppliers'
      });
    } catch (err) {
      console.error(err);
      res.redirect('/master/suppliers');
    }
  }

  async update(req, res) {
    try {
      const result = await SupplierService.updateSupplier(req.params.id, req.body);
      if (!result) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      req.flash('success', 'Supplier berhasil diperbarui.');
      res.redirect('/master/suppliers');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal memperbarui supplier.');
      res.redirect(`/master/suppliers/${req.params.id}/edit`);
    }
  }

  async destroy(req, res) {
    try {
      await SupplierService.deleteSupplier(req.params.id);
      req.flash('success', 'Supplier berhasil dinonaktifkan.');
      res.redirect('/master/suppliers');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal menghapus supplier.');
      res.redirect('/master/suppliers');
    }
  }
}

module.exports = new SupplierController();
