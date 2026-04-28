const { StockIn, StockOut } = require('../models');
const { Op } = require('sequelize');

class ReferenceGenerator {
  static async stockIn() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    
    const today = now.toISOString().split('T')[0];
    const last = await StockIn.findOne({
      where: { created_at: { [Op.gte]: today } },
      order: [['id', 'DESC']],
    });
    
    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.reference_no.slice(-3), 10);
      seq = (lastSeq || 0) + 1;
    }
    return `BM-${dateStr}-${String(seq).padStart(3, '0')}`;
  }

  static async stockOut() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    
    const today = now.toISOString().split('T')[0];
    const last = await StockOut.findOne({
      where: { created_at: { [Op.gte]: today } },
      order: [['id', 'DESC']],
    });
    
    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.reference_no.slice(-3), 10);
      seq = (lastSeq || 0) + 1;
    }
    return `BK-${dateStr}-${String(seq).padStart(3, '0')}`;
  }
}

module.exports = ReferenceGenerator;
