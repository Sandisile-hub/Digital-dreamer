// public/js/auth.js
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check if user is logged in on page load
    this.checkAuthentication();
    
    // Add event listener for all navigation links
    this.setupNavigationHandlers();
  }

  // Check if user is authenticated
  async checkAuthentication() {
    try {
      const userData = localStorage.getItem('currentUser');
      
      if (userData) {
        this.currentUser = JSON.parse(userData);
        this.applyRoleBasedRestrictions();
        return true;
      }

      // If no user data, redirect to signin
      if (!window.location.pathname.includes('signin') && 
          !window.location.pathname.includes('signup')) {
        window.location.href = '/signin';
      }
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Get current user role
  getUserRole() {
    return this.currentUser?.role || 'guest';
  }

  // Check if user has required role
  hasRole(requiredRole) {
    const userRole = this.getUserRole();
    
    // Role hierarchy (if needed)
    const roleHierarchy = {
      'nec': 4,
      'bec': 3,
      'alumni': 2,
      'member': 1,
      'guest': 0
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  // Redirect to appropriate dashboard based on role
  redirectToDashboard() {
    const role = this.getUserRole();
    let dashboardUrl = '';

    switch (role) {
      case 'nec':
        dashboardUrl = '/nec-dashboard.html';
        break;
      case 'bec':
        dashboardUrl = '/bec-dashboard.html';
        break;
      case 'alumni':
        dashboardUrl = '/alumni-dashboard.html';
        break;
      case 'member':
      default:
        dashboardUrl = '/gnm_dashboard.html';
        break;
    }

    // Only redirect if not already on the correct dashboard
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== dashboardUrl) {
      window.location.href = dashboardUrl;
    }
  }

  // Apply role-based UI restrictions
  applyRoleBasedRestrictions() {
    const role = this.getUserRole();
    
    // Hide/show elements based on role
    const elementsToHide = document.querySelectorAll('[data-role]');
    
    elementsToHide.forEach(element => {
      const requiredRoles = element.getAttribute('data-role').split(' ');
      const shouldShow = requiredRoles.includes(role) || requiredRoles.includes('all');
      
      element.style.display = shouldShow ? '' : 'none';
    });

    // Update navigation links
    this.updateNavigationLinks();
  }

  // Update navigation based on user role
  updateNavigationLinks() {
    const role = this.getUserRole();
    const navLinks = document.querySelectorAll('a[data-dashboard]');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.redirectToDashboard();
      });
    });
  }

  // Setup handlers for all navigation
  setupNavigationHandlers() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      
      if (link && link.getAttribute('href') === '/dashboard') {
        e.preventDefault();
        this.redirectToDashboard();
      }
    });
  }

  // Login function
  async login(email, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        this.redirectToDashboard();
        return true;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  // Logout function
  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = '/signin';
  }

  // Check access for specific pages
  checkPageAccess() {
    const currentPage = window.location.pathname.split('/').pop();
    const role = this.getUserRole();

    const pageAccess = {
      'nec-dashboard.html': ['nec'],
      'bec-dashboard.html': ['bec', 'nec'],
      'alumni-dashboard.html': ['alumni', 'bec', 'nec'],
      'gnm_dashboard.html': ['member', 'alumni', 'bec', 'nec']
    };

    if (pageAccess[currentPage] && !pageAccess[currentPage].includes(role)) {
      this.redirectToDashboard();
    }
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.authManager = new AuthManager();
  
  // Check page access on load
  setTimeout(() => {
    window.authManager.checkPageAccess();
  }, 100);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}