const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', {
    layout: false,
    title: 'Login — TAKKA STEEL',
    error: req.flash('error'),
    currentPath: '/login',
  });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      req.flash('error', 'Email atau password salah.');
      return res.redirect('/login');
    }

    if (!user.is_active) {
      req.flash('error', 'Akun Anda tidak aktif. Hubungi administrator.');
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.flash('success', `Selamat datang, ${user.name}!`);
    return res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Terjadi kesalahan sistem.');
    return res.redirect('/login');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
