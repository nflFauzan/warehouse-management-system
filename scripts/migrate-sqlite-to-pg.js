/**
 * scripts/migrate-sqlite-to-pg.js
 * 
 * This script migrates data from the existing SQLite database to a PostgreSQL database.
 * It uses the existing Sequelize models to ensure schema consistency.
 * 
 * Prerequisites:
 * 1. Install pg and pg-hstore: npm install pg pg-hstore
 * 2. Set up PostgreSQL connection in .env:
 *    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// ─── SOURCE: SQLITE ──────────────────────────────────
const sqlite = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', process.env.DB_STORAGE || 'database.sqlite'),
  logging: false,
});

// ─── DESTINATION: POSTGRESQL ─────────────────────────
const postgres = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: { underscored: true, timestamps: true }
  }
);

// Import existing models but rebind them to the specific instances
// Since your models are in one file, we'll re-define them for both instances
function defineModels(sequelizeInstance) {
  const User = sequelizeInstance.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('owner', 'admin', 'staff'), allowNull: false, defaultValue: 'staff' },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'users', timestamps: true, underscored: true });

  const Category = sequelizeInstance.define('Category', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  }, { tableName: 'categories', timestamps: false });

  const Unit = sequelizeInstance.define('Unit', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    abbr: { type: DataTypes.STRING(10), allowNull: false },
  }, { tableName: 'units', timestamps: false });

  const Supplier = sequelizeInstance.define('Supplier', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(150) },
    address: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'suppliers', timestamps: true, underscored: true });

  const Customer = sequelizeInstance.define('Customer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(150) },
    address: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'customers', timestamps: true, underscored: true });

  const Item = sequelizeInstance.define('Item', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    unit_id: { type: DataTypes.INTEGER, allowNull: false },
    current_stock: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    minimum_stock: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    description: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'items', timestamps: true, underscored: true });

  const StockIn = sequelizeInstance.define('StockIn', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reference_no: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    supplier_id: { type: DataTypes.INTEGER, allowNull: false },
    received_by: { type: DataTypes.INTEGER, allowNull: false },
    supplier_ref: { type: DataTypes.STRING(100) },
    received_at: { type: DataTypes.DATEONLY, allowNull: false },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('draft', 'confirmed'), allowNull: false, defaultValue: 'draft' },
    confirmed_at: { type: DataTypes.DATE },
    confirmed_by: { type: DataTypes.INTEGER },
  }, { tableName: 'stock_ins', timestamps: true, underscored: true });

  const StockInItem = sequelizeInstance.define('StockInItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    stock_in_id: { type: DataTypes.INTEGER, allowNull: false },
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    stock_before: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    stock_after: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  }, { tableName: 'stock_in_items', timestamps: false });

  const StockOut = sequelizeInstance.define('StockOut', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reference_no: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    issued_by: { type: DataTypes.INTEGER, allowNull: false },
    issued_at: { type: DataTypes.DATEONLY, allowNull: false },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('draft', 'confirmed'), allowNull: false, defaultValue: 'draft' },
    confirmed_at: { type: DataTypes.DATE },
    confirmed_by: { type: DataTypes.INTEGER },
  }, { tableName: 'stock_outs', timestamps: true, underscored: true });

  const StockOutItem = sequelizeInstance.define('StockOutItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    stock_out_id: { type: DataTypes.INTEGER, allowNull: false },
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    stock_before: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    stock_after: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  }, { tableName: 'stock_out_items', timestamps: false });

  const StockMutation = sequelizeInstance.define('StockMutation', {
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

  return { User, Category, Unit, Supplier, Customer, Item, StockIn, StockInItem, StockOut, StockOutItem, StockMutation };
}

async function migrate() {
  console.log('🚀 Starting Migration: SQLite -> PostgreSQL');
  
  const sourceModels = defineModels(sqlite);
  const destModels = defineModels(postgres);

  // Order matters for Foreign Key constraints
  const modelOrder = [
    'User', 'Category', 'Unit', 'Supplier', 'Customer', 
    'Item', 'StockIn', 'StockOut', 
    'StockInItem', 'StockOutItem', 'StockMutation'
  ];

  try {
    // 1. Sync Postgres schema
    console.log('─ Syncing PostgreSQL schema...');
    await postgres.sync({ force: true });
    console.log('✔ PostgreSQL schema synced.');

    const summary = [];

    // 2. Migrate data table by table
    for (const modelName of modelOrder) {
      console.log(`─ Migrating ${modelName}...`);
      const sourceModel = sourceModels[modelName];
      const destModel = destModels[modelName];

      const rows = await sourceModel.findAll({ raw: true });
      if (rows.length > 0) {
        // Use bulkCreate but ensure primary keys are preserved
        await destModel.bulkCreate(rows, { 
          validate: true,
          hooks: false,
          individualHooks: false
        });
        
        // 3. Reset Postgres sequences for this table
        const tableName = destModel.getTableName();
        await postgres.query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM ${tableName};`);
      }

      console.log(`✔ ${modelName}: ${rows.length} rows migrated.`);
      summary.push({ model: modelName, count: rows.length });
    }

    // 4. Verification Summary
    console.log('\n🏁 Migration Complete!');
    console.log('──────────────────────────────────────');
    console.table(summary);
    console.log('──────────────────────────────────────');
    console.log('Final Verification: Check your PostgreSQL database to ensure data consistency.');

  } catch (error) {
    console.error('\n❌ Migration Failed!');
    console.error(error);
  } finally {
    await sqlite.close();
    await postgres.close();
  }
}

migrate();
