const router = require('express').Router();
const { isAuthenticated } = require('../middleware/auth');
const { Item, Unit } = require('../models');
const { Op } = require('sequelize');

// Autocomplete items
router.get('/items/search', isAuthenticated, async (req, res) => {
  try {
    const q = req.query.q || '';
    const items = await Item.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { code: { [Op.like]: `%${q}%` } },
          { name: { [Op.like]: `%${q}%` } },
        ],
      },
      include: [{ model: Unit, as: 'unit', attributes: ['abbr'] }],
      limit: 10,
      attributes: ['id', 'code', 'name', 'current_stock', 'unit_id'],
    });

    res.json(items.map(i => ({
      id: i.id,
      code: i.code,
      name: i.name,
      current_stock: parseFloat(i.current_stock),
      unit: i.unit ? i.unit.abbr : '',
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
