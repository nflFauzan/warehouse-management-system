const ExcelReportService = require('../services/ExcelReportService');

class ReportController {
  async downloadRekapItem(req, res) {
    try {
      const workbook = await ExcelReportService.exportRekapItem(req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=rekap-item.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async downloadRekapCustomer(req, res) {
    try {
      const workbook = await ExcelReportService.exportRekapCustomer(req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=rekap-customer.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async downloadRekapSupplier(req, res) {
    try {
      const workbook = await ExcelReportService.exportRekapSupplier(req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=rekap-supplier.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async downloadRekapHarian(req, res) {
    try {
      const { date } = req.query;
      const workbook = await ExcelReportService.exportRekapHarian(date || new Date());
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=rekap-harian-${date}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new ReportController();
