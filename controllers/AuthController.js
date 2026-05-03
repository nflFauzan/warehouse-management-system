const AuthService = require('../services/AuthService');

class AuthController {
  showLogin(req, res) {
    if (req.session.user) return res.redirect('/');
    res.render('auth/login', {
      layout: false,
      title: 'Login — TAKKA STEEL',
      error: req.flash('error'),
      currentPath: '/login',
    });
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await AuthService.authenticate(email, password);

      req.session.user = user;
      req.flash('success', `Selamat datang, ${user.name}!`);
      return res.redirect('/');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Terjadi kesalahan sistem.');
      return res.redirect('/login');
    }
  }

  logout(req, res) {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  }

  // ─── USER MANAGEMENT (Settings) ─────────────────────
  async indexUsers(req, res) {
    try {
      const users = await AuthService.getAllUsers();
      res.render('settings/users/index', {
        title: 'Kelola User — TAKKA STEEL',
        users,
        currentPath: '/settings/users',
      });
    } catch (err) {
      console.error(err);
      res.redirect('/');
    }
  }

  createUsers(req, res) {
    res.render('settings/users/form', {
      title: 'Tambah User — TAKKA STEEL',
      editUser: null,
      currentPath: '/settings/users',
    });
  }

  async storeUsers(req, res) {
    try {
      await AuthService.createUser(req.body);
      req.flash('success', 'User berhasil ditambahkan.');
      res.redirect('/settings/users');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal menambah user.');
      res.redirect('/settings/users/create');
    }
  }

  async editUsers(req, res) {
    try {
      const editUser = await AuthService.getUserById(req.params.id);
      if (!editUser) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      res.render('settings/users/form', {
        title: 'Edit User — TAKKA STEEL',
        editUser,
        currentPath: '/settings/users',
      });
    } catch (err) {
      console.error(err);
      res.redirect('/settings/users');
    }
  }

  async updateUsers(req, res) {
    try {
      const result = await AuthService.updateUser(req.params.id, req.body);
      if (!result) return res.status(404).render('errors/404', { title: '404', currentPath: req.path });
      req.flash('success', 'User berhasil diperbarui.');
      res.redirect('/settings/users');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal memperbarui user.');
      res.redirect(`/settings/users/${req.params.id}/edit`);
    }
  }

  // ─── PROFILE ────────────────────────────────────────
  async showProfile(req, res) {
    try {
      const profileUser = await AuthService.getUserById(req.session.user.id);
      res.render('settings/profile', {
        title: 'Profil — TAKKA STEEL',
        profileUser,
        currentPath: '/settings/profile',
      });
    } catch (err) {
      console.error(err);
      res.redirect('/');
    }
  }

  async updateProfile(req, res) {
    try {
      const updatedUser = await AuthService.updateProfile(req.session.user.id, req.body);
      
      // Update session data
      req.session.user.name = updatedUser.name;
      req.session.user.email = updatedUser.email;

      req.flash('success', 'Profil berhasil diperbarui.');
      res.redirect('/settings/profile');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Gagal memperbarui profil.');
      res.redirect('/settings/profile');
    }
  }
}

module.exports = new AuthController();
