const { User } = require('../models');

async function checkUsers() {
  const users = await User.findAll();
  console.log('Users in DB:', users.map(u => ({ id: u.id, email: u.email, role: u.role, is_active: u.is_active })));
  process.exit();
}

checkUsers();
