const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: { underscored: true }
  }
);

// ─── USER ─────────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('owner', 'admin', 'staff'), allowNull: false, defaultValue: 'staff' },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'users', timestamps: true, underscored: true });

// ─── CATEGORY ─────────────────────────────────────────
const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
}, { tableName: 'categories', timestamps: false });

// ─── UNIT ─────────────────────────────────────────────
const Unit = sequelize.define('Unit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  abbr: { type: DataTypes.STRING(10), allowNull: false },
}, { tableName: 'units', timestamps: false });

// ─── SUPPLIER ─────────────────────────────────────────
const Supplier = sequelize.define('Supplier', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(150) },
  address: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'suppliers', timestamps: true, underscored: true });

// ─── CUSTOMER ─────────────────────────────────────────
const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(150) },
  address: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'customers', timestamps: true, underscored: true });

// ─── ITEM ─────────────────────────────────────────────
const Item = sequelize.define('Item', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  unit_id: { type: DataTypes.INTEGER, allowNull: false },
  current_stock: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  minimum_stock: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  description: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'items', timestamps: true, underscored: true,
  getterMethods: {
    status() {
      const current = parseFloat(this.getDataValue('current_stock')) || 0;
      const min = parseFloat(this.getDataValue('minimum_stock')) || 0;
      if (min <= 0) return 'no_min';
      if (current <= 0) return 'empty';
      if (current <= min) return 'critical';
      return 'safe';
    }
  }
});

// ─── STOCK IN (Header) ───────────────────────────────
const StockIn = sequelize.define('StockIn', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reference_no: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  supplier_id: { type: DataTypes.INTEGER, allowNull: true },
  received_by: { type: DataTypes.INTEGER, allowNull: false },
  supplier_ref: { type: DataTypes.STRING(100) },
  received_at: { type: DataTypes.DATEONLY, allowNull: false },
  notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('draft', 'confirmed'), allowNull: false, defaultValue: 'draft' },
  confirmed_at: { type: DataTypes.DATE },
  confirmed_by: { type: DataTypes.INTEGER },
}, { tableName: 'stock_ins', timestamps: true, underscored: true });

// ─── STOCK IN ITEMS (Detail) ─────────────────────────
const StockInItem = sequelize.define('StockInItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  stock_in_id: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  stock_before: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  stock_after: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'stock_in_items', timestamps: false });

// ─── STOCK OUT (Header) ──────────────────────────────
const StockOut = sequelize.define('StockOut', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reference_no: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  customer_id: { type: DataTypes.INTEGER, allowNull: true },
  issued_by: { type: DataTypes.INTEGER, allowNull: false },
  issued_at: { type: DataTypes.DATEONLY, allowNull: false },
  notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('draft', 'confirmed'), allowNull: false, defaultValue: 'draft' },
  confirmed_at: { type: DataTypes.DATE },
  confirmed_by: { type: DataTypes.INTEGER },
}, { tableName: 'stock_outs', timestamps: true, underscored: true });

// ─── STOCK OUT ITEMS (Detail) ────────────────────────
const StockOutItem = sequelize.define('StockOutItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  stock_out_id: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  stock_before: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  stock_after: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'stock_out_items', timestamps: false });

// ─── STOCK MUTATION (Audit) ──────────────────────────
const StockMutation = sequelize.define('StockMutation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('in', 'out'), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  stock_before: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  stock_after: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  reference_type: { type: DataTypes.STRING(50), allowNull: false },
  reference_id: { type: DataTypes.INTEGER, allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'stock_mutations', timestamps: true, updatedAt: false, underscored: true });

// ─── WAREHOUSE LAYOUT ─────────────────────────────────
const WarehouseLayout = sequelize.define('WarehouseLayout', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  cols: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'warehouse_layouts', timestamps: true, underscored: true });

// ─── WAREHOUSE SLOT ───────────────────────────────────
const WarehouseSlot = sequelize.define('WarehouseSlot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  layout_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(50), allowNull: false },
  x: { type: DataTypes.INTEGER, allowNull: false },
  y: { type: DataTypes.INTEGER, allowNull: false },
  z: { type: DataTypes.INTEGER, defaultValue: 0 },
  zone: { type: DataTypes.STRING(50) },
  rack: { type: DataTypes.STRING(50) },
  section: { type: DataTypes.STRING(50) },
  capacity: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }, // 0 means unlimited
}, { tableName: 'warehouse_slots', timestamps: true, underscored: true });

// ─── STOCK POSITION ───────────────────────────────────
const StockPosition = sequelize.define('StockPosition', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  slot_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'stock_positions', timestamps: true, underscored: true });

// ─── POSITION MOVEMENT ────────────────────────────────
const PositionMovement = sequelize.define('PositionMovement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  from_slot_id: { type: DataTypes.INTEGER, allowNull: true },
  to_slot_id: { type: DataTypes.INTEGER, allowNull: true },
  quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  moved_by: { type: DataTypes.INTEGER, allowNull: false },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'position_movements', timestamps: true, updatedAt: false, underscored: true });

// ─── ASSOCIATIONS ────────────────────────────────────
Item.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Item.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Category.hasMany(Item, { foreignKey: 'category_id' });
Unit.hasMany(Item, { foreignKey: 'unit_id' });

StockIn.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
StockIn.belongsTo(User, { foreignKey: 'received_by', as: 'receivedBy' });
StockIn.belongsTo(User, { foreignKey: 'confirmed_by', as: 'confirmedBy' });
StockIn.hasMany(StockInItem, { foreignKey: 'stock_in_id', as: 'items' });
StockInItem.belongsTo(StockIn, { foreignKey: 'stock_in_id' });
StockInItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

StockOut.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
StockOut.belongsTo(User, { foreignKey: 'issued_by', as: 'issuedBy' });
StockOut.belongsTo(User, { foreignKey: 'confirmed_by', as: 'confirmedBy' });
StockOut.hasMany(StockOutItem, { foreignKey: 'stock_out_id', as: 'items' });
StockOutItem.belongsTo(StockOut, { foreignKey: 'stock_out_id' });
StockOutItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

StockMutation.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
StockMutation.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });

// New Associations
WarehouseLayout.hasMany(WarehouseSlot, { foreignKey: 'layout_id', as: 'slots' });
WarehouseSlot.belongsTo(WarehouseLayout, { foreignKey: 'layout_id' });

WarehouseSlot.hasMany(StockPosition, { foreignKey: 'slot_id', as: 'positions' });
StockPosition.belongsTo(WarehouseSlot, { foreignKey: 'slot_id' });
StockPosition.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
Item.hasMany(StockPosition, { foreignKey: 'item_id', as: 'positions' });

PositionMovement.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
PositionMovement.belongsTo(WarehouseSlot, { foreignKey: 'from_slot_id', as: 'fromSlot' });
PositionMovement.belongsTo(WarehouseSlot, { foreignKey: 'to_slot_id', as: 'toSlot' });
PositionMovement.belongsTo(User, { foreignKey: 'moved_by', as: 'movedBy' });

module.exports = {
  sequelize,
  User, Category, Unit, Supplier, Customer, Item,
  StockIn, StockInItem, StockOut, StockOutItem, StockMutation,
  WarehouseLayout, WarehouseSlot, StockPosition, PositionMovement
};
