const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');

class AuthService {
  async authenticate(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('Email atau password salah.');
    if (!bcrypt.compareSync(password, user.password)) throw new Error('Email atau password salah.');
    if (!user.is_active) throw new Error('Akun Anda tidak aktif. Hubungi administrator.');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async getAllUsers() {
    return await UserRepository.findAll();
  }

  async getUserById(id) {
    return await UserRepository.findById(id);
  }

  async createUser(data) {
    const { name, email, password, role } = data;
    return await UserRepository.create({
      name,
      email,
      role,
      password: bcrypt.hashSync(password, 10),
    });
  }

  async updateUser(id, data) {
    const { name, email, password, role, is_active } = data;
    const updateData = { 
      name, 
      email, 
      role, 
      is_active: is_active === 'on' || is_active === '1' || is_active === true
    };
    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }
    return await UserRepository.update(id, updateData);
  }

  async updateProfile(id, data) {
    const user = await UserRepository.findById(id);
    if (!user) throw new Error('User tidak ditemukan.');

    const { name, email, current_password, new_password } = data;

    if (new_password) {
      if (!bcrypt.compareSync(current_password, user.password)) {
        throw new Error('Password lama salah.');
      }
      user.password = bcrypt.hashSync(new_password, 10);
    }

    user.name = name;
    user.email = email;
    await user.save();

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}

module.exports = new AuthService();
