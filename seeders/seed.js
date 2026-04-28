const bcrypt = require('bcryptjs');
const { User, Category, Unit, Item, Supplier, Customer } = require('../models');

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Users ─────────────────────────────────────
  const users = [
    { name: 'Owner TAKKA', email: 'owner@takka.com', password: bcrypt.hashSync('password', 10), role: 'owner' },
    { name: 'Admin TAKKA', email: 'admin@takka.com', password: bcrypt.hashSync('password', 10), role: 'admin' },
    { name: 'Staff Gudang', email: 'staff@takka.com', password: bcrypt.hashSync('password', 10), role: 'staff' },
  ];
  for (const u of users) {
    await User.findOrCreate({ where: { email: u.email }, defaults: u });
  }

  // ─── Categories ────────────────────────────────
  const catNames = ['Baja Profil', 'Hollow', 'Pipa', 'Plat Besi', 'Bahan Bangunan'];
  const cats = {};
  for (const name of catNames) {
    const [cat] = await Category.findOrCreate({ where: { slug: slugify(name) }, defaults: { name, slug: slugify(name) } });
    cats[slugify(name)] = cat.id;
  }

  // ─── Units ─────────────────────────────────────
  const unitData = [
    { name: 'Batang', abbr: 'btg' },
    { name: 'Lembar', abbr: 'lbr' },
    { name: 'Kilogram', abbr: 'kg' },
    { name: 'Roll', abbr: 'roll' },
    { name: 'Pcs', abbr: 'pcs' },
  ];
  const units = {};
  for (const u of unitData) {
    const [unit] = await Unit.findOrCreate({ where: { abbr: u.abbr }, defaults: u });
    units[u.abbr] = unit.id;
  }

  // ─── Suppliers ─────────────────────────────────
  const suppliers = [
    { code: 'SUP-001', name: 'PT Krakatau Steel', phone: '021-55001234', email: 'sales@krakatau.co.id', address: 'Cilegon, Banten' },
    { code: 'SUP-002', name: 'PT Gunung Raja Paksi', phone: '021-89001234', email: 'info@grp.co.id', address: 'Bekasi, Jawa Barat' },
    { code: 'SUP-003', name: 'PT Ispat Indo', phone: '031-55006789', email: 'order@ispat.co.id', address: 'Sidoarjo, Jawa Timur' },
  ];
  for (const s of suppliers) {
    await Supplier.findOrCreate({ where: { code: s.code }, defaults: s });
  }

  // ─── Customers ─────────────────────────────────
  const customers = [
    { code: 'CUS-001', name: 'CV Maju Jaya Konstruksi', phone: '0812-34567890', email: 'majujaya@gmail.com', address: 'Makassar, Sulsel' },
    { code: 'CUS-002', name: 'PT Bangun Karya', phone: '0813-98765432', email: 'bangunkarya@gmail.com', address: 'Jakarta Selatan' },
    { code: 'CUS-003', name: 'Toko Besi Sejahtera', phone: '0857-11223344', email: 'besi.sejahtera@yahoo.com', address: 'Surabaya, Jatim' },
  ];
  for (const c of customers) {
    await Customer.findOrCreate({ where: { code: c.code }, defaults: c });
  }

  // ─── Items ─────────────────────────────────────
  const items = [
    { code: 'BJ-CNP-001', name: 'Baja CNP 100x50x3mm', category_id: cats['baja-profil'], unit_id: units['btg'], current_stock: 245, minimum_stock: 50 },
    { code: 'HL-4040-001', name: 'Hollow 40x40x1.5mm', category_id: cats['hollow'], unit_id: units['btg'], current_stock: 88, minimum_stock: 100 },
    { code: 'PP-GI-050', name: 'Pipa GI 1/2" Medium', category_id: cats['pipa'], unit_id: units['btg'], current_stock: 12, minimum_stock: 50 },
    { code: 'BJ-WF-001', name: 'Baja WF 150x75x5mm', category_id: cats['baja-profil'], unit_id: units['btg'], current_stock: 120, minimum_stock: 30 },
    { code: 'PL-HT-001', name: 'Plat Hitam 2mm 4x8', category_id: cats['plat-besi'], unit_id: units['lbr'], current_stock: 35, minimum_stock: 20 },
    { code: 'HL-2040-001', name: 'Hollow 20x40x1.2mm', category_id: cats['hollow'], unit_id: units['btg'], current_stock: 200, minimum_stock: 80 },
    { code: 'PP-BS-001', name: 'Pipa Besi Hitam 3/4"', category_id: cats['pipa'], unit_id: units['btg'], current_stock: 0, minimum_stock: 30 },
    { code: 'BJ-UNP-001', name: 'Baja UNP 100x50', category_id: cats['baja-profil'], unit_id: units['btg'], current_stock: 75, minimum_stock: 40 },
    { code: 'BB-SMN-001', name: 'Semen Portland 50kg', category_id: cats['bahan-bangunan'], unit_id: units['pcs'], current_stock: 500, minimum_stock: 100 },
    { code: 'BB-BWI-001', name: 'Besi Wiremesh M8', category_id: cats['bahan-bangunan'], unit_id: units['lbr'], current_stock: 15, minimum_stock: 25 },
  ];
  for (const i of items) {
    await Item.findOrCreate({ where: { code: i.code }, defaults: i });
  }

  console.log('✅ Seeding complete!');
}

module.exports = seed;
