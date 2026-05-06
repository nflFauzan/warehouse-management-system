require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const methodOverride = require('method-override');
const { sequelize } = require('./models');
const { setLocals } = require('./middleware/auth');
const seed = require('./seeders/seed');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use('/api/v1', require('./routes/api_v1'));

// ─── 404 ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
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
