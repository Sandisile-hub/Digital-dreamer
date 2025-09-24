// middleware/auth.js
const database = require('../config/database');

// Authentication middleware
const authenticateUser = (req, res, next) => {
  // Skip authentication for these public routes
  const publicRoutes = ['/', '/signin', '/signup', '/api/login', '/api/health'];
  if (publicRoutes.includes(req.path) || req.path.startsWith('/api/')) {
    return next();
  }

  // Check if user is logged in (you might want to use sessions or JWT)
  const userId = req.session?.userId || req.headers['user-id']; // Adjust based on your auth method
  
  if (!userId) {
    return res.redirect('/signin');
  }

  // Get user role from database
  const sql = 'SELECT role, status FROM users WHERE id = $1';
  database.query(sql, [userId], (error, result) => {
    if (error || result.rows.length === 0) {
      console.log('Auth error:', error);
      return res.redirect('/signin');
    }

    const user = result.rows[0];
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.redirect('/signin?error=account_inactive');
    }

    // Attach user info to request for use in routes
    req.user = user;
    next();
  });
};

// Role-based redirection middleware
const redirectToDashboard = (req, res, next) => {
  // Only redirect dashboard-specific routes
  const dashboardRoutes = ['/dashboard', '/nec-dashboard', '/bec-dashboard', '/alumni-dashboard'];
  
  if (!dashboardRoutes.includes(req.path)) {
    return next();
  }

  if (!req.user) {
    return res.redirect('/signin');
  }

  let dashboardPath = '';
  
  switch (req.user.role) {
    case 'nec':
      dashboardPath = '/nec-dashboard';
      break;
    case 'bec':
      dashboardPath = '/bec-dashboard';
      break;
    case 'alumni':
      dashboardPath = '/alumni-dashboard';
      break;
    case 'member':
    default:
      dashboardPath = '/gnm_dashboard';
      break;
  }

  // If user is already on their correct dashboard, proceed
  if (req.path === dashboardPath) {
    return next();
  }

  // Redirect to correct dashboard
  res.redirect(dashboardPath);
};

// Route protection middleware for specific roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/signin');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).send('Access denied');
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  redirectToDashboard,
  requireRole
};