const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { isAuthenticated, checkRole } = require('../middleware/auth');
const { User } = require('../models');

router.get('/users', isAuthenticated, checkRole('owner'), async (req, res) => {
  const users = await User.findAll({ order: [['name', 'ASC']] });
  res.render('settings/users/index', {
    title: 'Kelola User — TAKKA STEEL',
    users,
    currentPath: '/settings/users',
  });
});

router.get('/users/create', isAuthenticated, checkRole('owner'), (req, res) => {
  res.render('settings/users/form', {
    title: 'Tambah User — TAKKA STEEL',
    editUser: null,
    currentPath: '/settings/users',
  });
});

router.post('/users', isAuthenticated, checkRole('owner'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    await User.create({
      name, email, role,
      password: bcrypt.hashSync(password, 10),
    });
    req.flash('success', 'User berhasil ditambahkan.');
    res.redirect('/settings/users');
  } catch (err) {
    req.flash('error', err.message || 'Gagal menambah user.');
    res.redirect('/settings/users/create');
  }
});

router.get('/users/:id/edit', isAuthenticated, checkRole('owner'), async (req, res) => {
  const editUser = await User.findByPk(req.params.id);
  if (!editUser) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
  res.render('settings/users/form', {
    title: 'Edit User — TAKKA STEEL',
    editUser,
    currentPath: '/settings/users',
  });
});

router.put('/users/:id', isAuthenticated, checkRole('owner'), async (req, res) => {
  try {
    const editUser = await User.findByPk(req.params.id);
    if (!editUser) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
    const { name, email, password, role, is_active } = req.body;
    const data = { name, email, role, is_active: is_active === 'on' || is_active === '1' };
    if (password) data.password = bcrypt.hashSync(password, 10);
    await editUser.update(data);
    req.flash('success', 'User berhasil diperbarui.');
    res.redirect('/settings/users');
  } catch (err) {
    req.flash('error', err.message || 'Gagal memperbarui user.');
    res.redirect(`/settings/users/${req.params.id}/edit`);
  }
});

router.get('/profile', isAuthenticated, async (req, res) => {
  const profileUser = await User.findByPk(req.session.user.id);
  res.render('settings/profile', {
    title: 'Profil — TAKKA STEEL',
    profileUser,
    currentPath: '/settings/profile',
  });
});

router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const profileUser = await User.findByPk(req.session.user.id);
    const { name, email, current_password, new_password } = req.body;
    if (new_password) {
      if (!bcrypt.compareSync(current_password, profileUser.password)) {
        req.flash('error', 'Password lama salah.');
        return res.redirect('/settings/profile');
      }
      profileUser.password = bcrypt.hashSync(new_password, 10);
    }
    profileUser.name = name;
    profileUser.email = email;
    await profileUser.save();
    req.session.user.name = name;
    req.session.user.email = email;
    req.flash('success', 'Profil berhasil diperbarui.');
    res.redirect('/settings/profile');
  } catch (err) {
    req.flash('error', err.message || 'Gagal memperbarui profil.');
    res.redirect('/settings/profile');
  }
});

module.exports = router;
