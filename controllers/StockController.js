const StockService = require('../services/StockService');
const StockRepository = require('../repositories/StockRepository');

class StockController {
  // ─── BARANG MASUK ───────────────────────────────────
  async indexMasuk(req, res) {
    try {
      const data = await StockService.getStockInList(req.query);
      res.render('transaksi/masuk/index', {
        title: 'Barang Masuk — TAKKA STEEL',
        ...data,
        search: req.query.search || '',
        status: req.query.status || '',
        currentPath: '/transaksi/masuk',
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal memuat data barang masuk.');
      res.redirect('/');
    }
  }

  async createMasuk(req, res) {
    try {
      const data = await StockService.getStockInCreateData();
      res.render('transaksi/masuk/form', {
        title: 'Tambah Barang Masuk — TAKKA STEEL',
        stockIn: null,
        ...data,
        currentPath: '/transaksi/masuk',
      });
    } catch (err) {
      console.error(err);
      res.redirect('/transaksi/masuk');
    }
  }

  async storeMasuk(req, res) {
    try {
      const stockIn = await StockService.createStockInDraft(req.body, req.session.user.id);
      
      if (req.body.action === 'confirm' && ['admin', 'owner'].includes(req.session.user.role)) {
        return res.redirect(`/transaksi/masuk/${stockIn.id}/confirm-action`);
      }

      req.flash('success', 'Draft barang masuk berhasil disimpan.');
      res.redirect(`/transaksi/masuk/${stockIn.id}`);
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal menyimpan transaksi.');
      res.redirect('/transaksi/masuk/create');
    }
  }

  async showMasuk(req, res) {
    try {
      const stockIn = await StockRepository.findStockInById(req.params.id, true);
      if (!stockIn) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });

      res.render('transaksi/masuk/show', {
        title: `${stockIn.reference_no} — TAKKA STEEL`,
        stockIn,
        currentPath: '/transaksi/masuk',
      });
    } catch (err) {
      console.error(err);
      res.redirect('/transaksi/masuk');
    }
  }

  async confirmMasuk(req, res) {
    try {
      const stockIn = await StockService.confirmStockIn(req.params.id, req.session.user.id);
      req.flash('success', 'Transaksi berhasil dikonfirmasi. Stok telah diperbarui.');
      res.redirect(`/transaksi/masuk/${stockIn.id}`);
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal mengkonfirmasi transaksi.');
      res.redirect(`/transaksi/masuk/${req.params.id}`);
    }
  }

  // ─── BARANG KELUAR ──────────────────────────────────
  async indexKeluar(req, res) {
    try {
      const data = await StockService.getStockOutList(req.query);
      res.render('transaksi/keluar/index', {
        title: 'Barang Keluar — TAKKA STEEL',
        ...data,
        search: req.query.search || '',
        status: req.query.status || '',
        currentPath: '/transaksi/keluar',
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Gagal memuat data barang keluar.');
      res.redirect('/');
    }
  }

  async createKeluar(req, res) {
    try {
      const data = await StockService.getStockOutCreateData();
      res.render('transaksi/keluar/form', {
        title: 'Tambah Barang Keluar — TAKKA STEEL',
        stockOut: null,
        ...data,
        currentPath: '/transaksi/keluar',
      });
    } catch (err) {
      console.error(err);
      res.redirect('/transaksi/keluar');
    }
  }

  async storeKeluar(req, res) {
    try {
      const stockOut = await StockService.createStockOutDraft(req.body, req.session.user.id);
      
      if (req.body.action === 'confirm' && ['admin', 'owner'].includes(req.session.user.role)) {
        return res.redirect(`/transaksi/keluar/${stockOut.id}/confirm-action`);
      }

      req.flash('success', 'Draft barang keluar berhasil disimpan.');
      res.redirect(`/transaksi/keluar/${stockOut.id}`);
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal menyimpan transaksi.');
      res.redirect('/transaksi/keluar/create');
    }
  }

  async showKeluar(req, res) {
    try {
      const stockOut = await StockRepository.findStockOutById(req.params.id, true);
      if (!stockOut) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });

      res.render('transaksi/keluar/show', {
        title: `${stockOut.reference_no} — TAKKA STEEL`,
        stockOut,
        currentPath: '/transaksi/keluar',
      });
    } catch (err) {
      console.error(err);
      res.redirect('/transaksi/keluar');
    }
  }

  async confirmKeluar(req, res) {
    try {
      const stockOut = await StockService.confirmStockOut(req.params.id, req.session.user.id);
      req.flash('success', 'Transaksi berhasil dikonfirmasi. Stok telah diperbarui.');
      res.redirect(`/transaksi/keluar/${stockOut.id}`);
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal mengkonfirmasi transaksi.');
      res.redirect(`/transaksi/keluar/${req.params.id}`);
    }
  }
}

module.exports = new StockController();
