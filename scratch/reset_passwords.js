const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  const password = bcrypt.hashSync('password', 10);
  await User.update({ password }, {
    where: {
      email: ['owner@takka.com', 'admin@takka.com', 'staff@takka.com']
    }
  });
  console.log('Passwords reset successfully for takka users.');
  process.exit();
}

resetPasswords();
