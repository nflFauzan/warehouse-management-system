const ItemService = require('../services/ItemService');

class ItemController {
  async index(req, res) {
    try {
      const data = await ItemService.getItems(req.query);
      res.render('master/items/index', {
        title: 'Master Barang — TAKKA STEEL',
        ...data,
        search: req.query.search || '',
        category_id: req.query.category_id || '',
        status: req.query.status || '',
        currentPath: '/master/items',
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal memuat data barang.');
      res.redirect('/');
    }
  }

  async create(req, res) {
    try {
      const { categories, units } = await ItemService.getFormData();
      res.render('master/items/form', {
        title: 'Tambah Barang — TAKKA STEEL',
        item: null,
        categories,
        units,
        currentPath: '/master/items',
      });
    } catch (err) {
      console.error(err);
      res.redirect('/master/items');
    }
  }

  async store(req, res) {
    try {
      await ItemService.createItem(req.body);
      req.flash('success', 'Barang berhasil ditambahkan.');
      res.redirect('/master/items');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal menambah barang.');
      res.redirect('/master/items/create');
    }
  }

  async edit(req, res) {
    try {
      const item = await ItemService.getItemById(req.params.id);
      if (!item) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      const { categories, units } = await ItemService.getFormData();
      res.render('master/items/form', {
        title: 'Edit Barang — TAKKA STEEL',
        item,
        categories,
        units,
        currentPath: '/master/items',
      });
    } catch (err) {
      console.error(err);
      res.redirect('/master/items');
    }
  }

  async update(req, res) {
    try {
      const result = await ItemService.updateItem(req.params.id, req.body);
      if (!result) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      req.flash('success', 'Barang berhasil diperbarui.');
      res.redirect('/master/items');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal memperbarui barang.');
      res.redirect(`/master/items/${req.params.id}/edit`);
    }
  }

  async destroy(req, res) {
    try {
      await ItemService.deleteItem(req.params.id);
      req.flash('success', 'Barang berhasil dinonaktifkan.');
      res.redirect('/master/items');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal menghapus barang.');
      res.redirect('/master/items');
    }
  }
}

module.exports = new ItemController();
