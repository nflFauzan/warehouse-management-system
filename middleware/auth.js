function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    return next();
  }
  return res.redirect('/login');
}

function checkRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('errors/403', {
        title: 'Akses Ditolak',
        currentPath: req.path,
      });
    }
    return next();
  };
}

function setLocals(req, res, next) {
  res.locals.user = req.session ? req.session.user : null;
  res.locals.currentPath = req.path;
  res.locals.success = req.flash ? req.flash('success') : [];
  res.locals.error = req.flash ? req.flash('error') : [];
  res.locals.formatNumber = (n) => {
    const num = parseFloat(n) || 0;
    return num % 1 === 0 ? num.toLocaleString('id-ID') : num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  res.locals.formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  next();
}

module.exports = { isAuthenticated, checkRole, setLocals };
