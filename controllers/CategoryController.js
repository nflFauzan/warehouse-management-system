const CategoryService = require('../services/CategoryService');

class CategoryController {
  async index(req, res) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.render('master/categories/index', {
        title: 'Master Kategori — TAKKA STEEL',
        categories,
        currentPath: '/master/categories',
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal memuat data kategori.');
      res.redirect('/');
    }
  }

  create(req, res) {
    res.render('master/categories/form', {
      title: 'Tambah Kategori',
      category: null,
      currentPath: '/master/categories'
    });
  }

  async store(req, res) {
    try {
      await CategoryService.createCategory(req.body);
      req.flash('success', 'Kategori berhasil ditambahkan.');
      res.redirect('/master/categories');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal menambah kategori.');
      res.redirect('/master/categories/create');
    }
  }

  async edit(req, res) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      if (!category) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      res.render('master/categories/form', {
        title: 'Edit Kategori',
        category,
        currentPath: '/master/categories'
      });
    } catch (err) {
      console.error(err);
      res.redirect('/master/categories');
    }
  }

  async update(req, res) {
    try {
      const result = await CategoryService.updateCategory(req.params.id, req.body);
      if (!result) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      
      req.flash('success', 'Kategori berhasil diperbarui.');
      res.redirect('/master/categories');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal memperbarui kategori.');
      res.redirect(`/master/categories/${req.params.id}/edit`);
    }
  }

  async destroy(req, res) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      req.flash('success', 'Kategori berhasil dihapus.');
      res.redirect('/master/categories');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal menghapus kategori. Pastikan tidak ada barang yang menggunakan kategori ini.');
      res.redirect('/master/categories');
    }
  }
}

module.exports = new CategoryController();
