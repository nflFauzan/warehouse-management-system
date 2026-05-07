const ExcelJS = require('exceljs');
const { Item, StockMutation, Supplier, Customer, StockIn, StockOut, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

class ExcelReportService {
  async exportRekapItem(filters) {
    const { item_id, year_start = 2023, year_end = 2026 } = filters;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap per Item');

    // Headers
    const headers = ['No', 'Customer', 'Kategori', 'Nama Barang', 'Price'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    for (let y = year_start; y <= year_end; y++) {
      months.forEach(m => headers.push(`${m} ${y}`));
    }
    headers.push('Keterangan');

    worksheet.addRow(headers);
    worksheet.getRow(1).font = { bold: true };

    // Fetch Items
    const where = {};
    if (item_id) where.id = item_id;
    
    const items = await Item.findAll({
      where,
      include: ['category'],
      order: [['name', 'ASC']]
    });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowData = [i + 1, '-', item.category.name, item.name, 0]; // Price not in model, default 0

      for (let y = year_start; y <= year_end; y++) {
        for (let m = 1; m <= 12; m++) {
          const startDate = dayjs(`${y}-${m}-01`).startOf('month').toDate();
          const endDate = dayjs(`${y}-${m}-01`).endOf('month').toDate();

          const qty = await StockMutation.sum('quantity', {
            where: {
              item_id: item.id,
              type: 'in',
              created_at: { [Op.between]: [startDate, endDate] }
            }
          }) || 0;
          rowData.push(qty);
        }
      }
      rowData.push(item.description || '');
      worksheet.addRow(rowData);
    }

    return workbook;
  }

  async exportRekapCustomer(filters) {
    const { customer_id, month, year } = filters;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap per Customer');

    worksheet.addRow(['Customer', 'Total Qty', 'Total Amount', 'Alamat', 'No HP', 'Keterangan']);
    worksheet.getRow(1).font = { bold: true };

    const where = { is_active: true };
    if (customer_id) where.id = customer_id;

    const customers = await Customer.findAll({ where });

    for (const cust of customers) {
      // Aggregate stock out for this customer
      const mutations = await StockMutation.findAll({
        include: [{
          model: Item,
          as: 'item'
        }],
        where: {
          reference_type: 'stock_out',
          created_at: month && year ? {
            [Op.between]: [
              dayjs(`${year}-${month}-01`).startOf('month').toDate(),
              dayjs(`${year}-${month}-01`).endOf('month').toDate()
            ]
          } : { [Op.not]: null }
        }
      });

      // Filter by customer via StockOut reference
      // This is slightly inefficient but keeps logic clean without adding more associations
      let totalQty = 0;
      for (const m of mutations) {
        const so = await StockOut.findByPk(m.reference_id);
        if (so && so.customer_id === cust.id) {
          totalQty += parseFloat(m.quantity);
        }
      }

      worksheet.addRow([
        cust.name,
        totalQty,
        0, // Amount placeholder
        cust.address,
        cust.phone,
        ''
      ]);
    }

    return workbook;
  }

  async exportRekapSupplier(filters) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap Supplier');

    worksheet.addRow(['Supplier Name', 'Items Supplied', 'Total Transactions', 'Total Volume']);
    worksheet.getRow(1).font = { bold: true };

    const suppliers = await Supplier.findAll();

    for (const sup of suppliers) {
      const stockIns = await StockIn.findAll({ where: { supplier_id: sup.id } });
      const stockInIds = stockIns.map(s => s.id);

      const itemsSupplied = await sequelize.query(
        `SELECT COUNT(DISTINCT item_id) as count FROM stock_in_items WHERE stock_in_id IN (${stockInIds.length ? stockInIds.join(',') : 0})`,
        { type: sequelize.QueryTypes.SELECT }
      );

      const totalVolume = await StockMutation.sum('quantity', {
        where: {
          reference_type: 'stock_in',
          reference_id: { [Op.in]: stockInIds }
        }
      }) || 0;

      worksheet.addRow([
        sup.name,
        itemsSupplied[0].count,
        stockIns.length,
        totalVolume
      ]);
    }

    return workbook;
  }

  async exportRekapHarian(date) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap Harian');

    worksheet.addRow(['Surat Jalan', 'Tanggal', 'No PO', 'Barang', 'Jumlah', 'Keterangan', 'Dibuat Oleh', 'Customer/Supplier']);
    worksheet.getRow(1).font = { bold: true };

    const start = dayjs(date).startOf('day').toDate();
    const end = dayjs(date).endOf('day').toDate();

    const mutations = await StockMutation.findAll({
      where: { created_at: { [Op.between]: [start, end] } },
      include: ['item', 'createdBy']
    });

    for (const m of mutations) {
      let refNo = '', partner = '', refPO = '';
      if (m.reference_type === 'stock_in') {
        const si = await StockIn.findByPk(m.reference_id, { include: ['supplier'] });
        refNo = si.reference_no;
        partner = si.supplier ? si.supplier.name : '-';
        refPO = si.supplier_ref || '-';
      } else {
        const so = await StockOut.findByPk(m.reference_id, { include: ['customer'] });
        refNo = so.reference_no;
        partner = so.customer ? so.customer.name : '-';
      }

      worksheet.addRow([
        refNo,
        dayjs(m.created_at).format('YYYY-MM-DD'),
        refPO,
        m.item.name,
        m.quantity,
        '',
        m.createdBy.name,
        partner
      ]);
    }

    return workbook;
  }
}

module.exports = new ExcelReportService();
