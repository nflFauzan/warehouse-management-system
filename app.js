require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const methodOverride = require('method-override');
const { sequelize } = require('./models');
const { setLocals } = require('./middleware/auth');
const seed = require('./seeders/seed');

const ejsLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── VIEW ENGINE ─────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layouts/main');

// ─── MIDDLEWARE ──────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'takka-steel-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(flash());
app.use(setLocals);

// ─── ROUTES ──────────────────────────────────────────
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/master', require('./routes/master'));
app.use('/transaksi', require('./routes/transaksi'));
app.use('/stock', require('./routes/stock'));
app.use('/laporan', require('./routes/laporan'));
app.use('/settings', require('./routes/settings'));
app.use('/api', require('./routes/api'));

// ─── 404 ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Halaman Tidak Ditemukan', currentPath: req.path });
});

// ─── START ───────────────────────────────────────────
async function start() {
  try {
    await sequelize.sync({ force: false });
    console.log('📦 Database synced');

    // Seed if empty
    const { User } = require('./models');
    const count = await User.count();
    if (count === 0) {
      await seed();
    }

    app.listen(PORT, () => {
      console.log(`🚀 TAKKA STEEL running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

start();
