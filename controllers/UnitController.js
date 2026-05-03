const UnitService = require('../services/UnitService');

class UnitController {
  async index(req, res) {
    try {
      const units = await UnitService.getAllUnits();
      res.render('master/units/index', {
        title: 'Master Satuan — TAKKA STEEL',
        units,
        currentPath: '/master/units',
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal memuat data satuan.');
      res.redirect('/');
    }
  }

  create(req, res) {
    res.render('master/units/form', {
      title: 'Tambah Satuan',
      unit: null,
      currentPath: '/master/units'
    });
  }

  async store(req, res) {
    try {
      await UnitService.createUnit(req.body);
      req.flash('success', 'Satuan berhasil ditambahkan.');
      res.redirect('/master/units');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal menambah satuan.');
      res.redirect('/master/units/create');
    }
  }

  async edit(req, res) {
    try {
      const unit = await UnitService.getUnitById(req.params.id);
      if (!unit) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      res.render('master/units/form', {
        title: 'Edit Satuan',
        unit,
        currentPath: '/master/units'
      });
    } catch (err) {
      console.error(err);
      res.redirect('/master/units');
    }
  }

  async update(req, res) {
    try {
      const result = await UnitService.updateUnit(req.params.id, req.body);
      if (!result) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      req.flash('success', 'Satuan berhasil diperbarui.');
      res.redirect('/master/units');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal memperbarui satuan.');
      res.redirect(`/master/units/${req.params.id}/edit`);
    }
  }

  async destroy(req, res) {
    try {
      await UnitService.deleteUnit(req.params.id);
      req.flash('success', 'Satuan berhasil dihapus.');
      res.redirect('/master/units');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal menghapus satuan. Pastikan tidak ada barang yang menggunakan satuan ini.');
      res.redirect('/master/units');
    }
  }
}

module.exports = new UnitController();
