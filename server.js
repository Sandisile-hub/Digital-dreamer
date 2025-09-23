const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import database connection
const database = require('./config/database');

// Test database when server starts
database.testConnection();

// Basic route - serve signin page
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

// Signup page route
app.get('/signup', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Signin page route
app.get('/signin', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

// Statistics dashboard route
app.get('/stats', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

// Health check
app.get('/api/health', function(req, res) {
  res.json({ 
    status: 'OK',
    message: 'Server is working',
    time: new Date().toISOString()
  });
});

// Get all users - only exact fields
app.get('/api/users', function(req, res) {
  var sql = 'SELECT id, name, email, password, role, branch_id, is_bec_member, nec_position, bec_position, status FROM users ORDER BY id';
  database.query(sql, [], function(error, result) {
    if (error) {
      console.log('Error getting users:', error);
      res.status(500).json({ error: 'Server error' });
    } else {
      res.json(result.rows);
    }
  });
});

// Get user by ID - only exact fields
app.get('/api/users/:id', function(req, res) {
  var userId = req.params.id;
  var sql = 'SELECT id, name, email, password, role, branch_id, is_bec_member, nec_position, bec_position, status FROM users WHERE id = $1';
  
  database.query(sql, [userId], function(error, result) {
    if (error) {
      console.log('Error getting user:', error);
      res.status(500).json({ error: 'Server error' });
    } else if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(result.rows[0]);
    }
  });
});

// Create new user (Signup) - only exact fields
app.post('/api/users', function(req, res) {
  var user = req.body;
  
  // Validate required fields
  if (!user.name || !user.email || !user.password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // First check if email already exists
  var checkSql = 'SELECT id FROM users WHERE email = $1';
  database.query(checkSql, [user.email], function(error, result) {
    if (error) {
      console.log('Error checking email:', error);
      res.status(500).json({ error: 'Server error' });
    } else if (result.rows.length > 0) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      // Insert new user with only exact fields
      var insertSql = `INSERT INTO users (name, email, password, role, branch_id, is_bec_member, nec_position, bec_position, status) 
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, email, role, branch_id, is_bec_member, nec_position, bec_position, status`;
      
      var values = [
        user.name,
        user.email, 
        user.password,
        user.role || 'member',
        user.branch_id || 1,
        user.is_bec_member || false,
        user.nec_position || null,
        user.bec_position || null,
        user.status || 'active'
      ];

      database.query(insertSql, values, function(error, result) {
        if (error) {
          console.log('Error creating user:', error);
          res.status(500).json({ error: 'Server error' });
        } else {
          res.status(201).json(result.rows[0]);
        }
      });
    }
  });
});

// Login route - only exact fields needed
app.post('/api/login', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  var sql = 'SELECT id, name, email, role, branch_id, is_bec_member, nec_position, bec_position, status FROM users WHERE email = $1 AND password = $2';
  
  database.query(sql, [email, password], function(error, result) {
    if (error) {
      console.log('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    } else if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
    } else {
      res.json({ 
        success: true, 
        user: result.rows[0],
        message: 'Login successful' 
      });
    }
  });
});

// Get all branches - only exact fields
app.get('/api/branches', function(req, res) {
  var sql = 'SELECT id, name, university, province, member_count, alumni_count FROM branches ORDER BY id';
  database.query(sql, [], function(error, result) {
    if (error) {
      console.log('Error getting branches:', error);
      res.status(500).json({ error: 'Server error' });
    } else {
      res.json(result.rows);
    }
  });
});

// Get branch by ID - only exact fields
app.get('/api/branches/:id', function(req, res) {
  var branchId = req.params.id;
  var sql = 'SELECT id, name, university, province, member_count, alumni_count FROM branches WHERE id = $1';
  
  database.query(sql, [branchId], function(error, result) {
    if (error) {
      console.log('Error getting branch:', error);
      res.status(500).json({ error: 'Server error' });
    } else if (result.rows.length === 0) {
      res.status(404).json({ error: 'Branch not found' });
    } else {
      res.json(result.rows[0]);
    }
  });
});

// Get all events - only exact fields with necessary joins
app.get('/api/events', function(req, res) {
  var sql = `SELECT e.id, e.title, e.date, e.branch_id, e.created_by, e.event_type 
             FROM events e 
             ORDER BY e.date`;
  
  database.query(sql, [], function(error, result) {
    if (error) {
      console.log('Error getting events:', error);
      res.status(500).json({ error: 'Server error' });
    } else {
      res.json(result.rows);
    }
  });
});

// Get event by ID - only exact fields
app.get('/api/events/:id', function(req, res) {
  var eventId = req.params.id;
  var sql = `SELECT id, title, date, branch_id, created_by, event_type 
             FROM events WHERE id = $1`;
  
  database.query(sql, [eventId], function(error, result) {
    if (error) {
      console.log('Error getting event:', error);
      res.status(500).json({ error: 'Server error' });
    } else if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.json(result.rows[0]);
    }
  });
});

// Create new event - only exact fields
app.post('/api/events', function(req, res) {
  var event = req.body;
  
  // Validate required fields
  if (!event.title || !event.date || !event.branch_id) {
    return res.status(400).json({ error: 'Title, date, and branch_id are required' });
  }

  var sql = `INSERT INTO events (title, date, branch_id, created_by, event_type) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, title, date, branch_id, created_by, event_type`;
  
  var values = [
    event.title,
    event.date,
    event.branch_id,
    event.created_by || 1,
    event.event_type || 'General'
  ];

  database.query(sql, values, function(error, result) {
    if (error) {
      console.log('Error creating event:', error);
      res.status(500).json({ error: 'Server error' });
    } else {
      res.status(201).json(result.rows[0]);
    }
  });
});

// Get all news - only exact fields
app.get('/api/news', function(req, res) {
  var sql = `SELECT id, title, content, branch_id, author_id, publish_date 
             FROM news 
             ORDER BY publish_date DESC`;
  
  database.query(sql, [], function(error, result) {
    if (error) {
      console.log('Error getting news:', error);
      res.status(500).json({ error: 'Server error' });
    } else {
      res.json(result.rows);
    }
  });
});

// Get news by ID - only exact fields
app.get('/api/news/:id', function(req, res) {
  var newsId = req.params.id;
  var sql = `SELECT id, title, content, branch_id, author_id, publish_date 
             FROM news WHERE id = $1`;
  
  database.query(sql, [newsId], function(error, result) {
    if (error) {
      console.log('Error getting news:', error);
      res.status(500).json({ error: 'Server error' });
    } else if (result.rows.length === 0) {
      res.status(404).json({ error: 'News article not found' });
    } else {
      res.json(result.rows[0]);
    }
  });
});

// Create new news - only exact fields
app.post('/api/news', function(req, res) {
  var news = req.body;
  
  // Validate required fields
  if (!news.title || !news.content || !news.branch_id) {
    return res.status(400).json({ error: 'Title, content, and branch_id are required' });
  }

  var sql = `INSERT INTO news (title, content, branch_id, author_id, publish_date) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, title, content, branch_id, author_id, publish_date`;
  
  var values = [
    news.title,
    news.content,
    news.branch_id,
    news.author_id || 1,
    news.publish_date || new Date().toISOString()
  ];

  database.query(sql, values, function(error, result) {
    if (error) {
      console.log('Error creating news:', error);
      res.status(500).json({ error: 'Server error' });
    } else {
      res.status(201).json(result.rows[0]);
    }
  });
});

// Get all alumni - only exact fields
app.get('/api/alumni', function(req, res) {
  var sql = `SELECT id, user_id, branch_id, graduation_date, degree, current_status 
             FROM alumni 
             ORDER BY graduation_date DESC`;
  
  database.query(sql, [], function(error, result) {
    if (error) {
      console.log('Error getting alumni:', error);
      res.status(500).json({ error: 'Server error' });
    } else {
      res.json(result.rows);
    }
  });
});

// Get alumni by ID - only exact fields
app.get('/api/alumni/:id', function(req, res) {
  var alumniId = req.params.id;
  var sql = `SELECT id, user_id, branch_id, graduation_date, degree, current_status 
             FROM alumni WHERE id = $1`;
  
  database.query(sql, [alumniId], function(error, result) {
    if (error) {
      console.log('Error getting alumni:', error);
      res.status(500).json({ error: 'Server error' });
    } else if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alumni record not found' });
    } else {
      res.json(result.rows[0]);
    }
  });
});


// Create new alumni record - only exact fields
app.post('/api/alumni', function(req, res) {
  var alumni = req.body;
  
  // Validate required fields
  if (!alumni.user_id || !alumni.branch_id || !alumni.graduation_date) {
    return res.status(400).json({ error: 'user_id, branch_id, and graduation_date are required' });
  }

  var sql = `INSERT INTO alumni (user_id, branch_id, graduation_date, degree, current_status) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, branch_id, graduation_date, degree, current_status`;
  
  var values = [
    alumni.user_id,
    alumni.branch_id,
    alumni.graduation_date,
    alumni.degree || 'Not Specified',
    alumni.current_status || 'Unknown'
  ];

  database.query(sql, values, function(error, result) {
    if (error) {
      console.log('Error creating alumni record:', error);
      res.status(500).json({ error: 'Server error' });
    } else {
      res.status(201).json(result.rows[0]);
    }
  });
});

// Update user - only exact fields
app.put('/api/users/:id', function(req, res) {
  var userId = req.params.id;
  var user = req.body;
  
  var sql = `UPDATE users SET 
             name = $1, email = $2, role = $3, branch_id = $4, 
             is_bec_member = $5, nec_position = $6, bec_position = $7, status = $8 
             WHERE id = $9 
             RETURNING id, name, email, role, branch_id, is_bec_member, nec_position, bec_position, status`;
  
  var values = [
    user.name,
    user.email,
    user.role,
    user.branch_id,
    user.is_bec_member,
    user.nec_position,
    user.bec_position,
    user.status,
    userId
  ];

  database.query(sql, values, function(error, result) {
    if (error) {
      console.log('Error updating user:', error);
      res.status(500).json({ error: 'Server error' });
    } else if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(result.rows[0]);
    }
  });
});

// Update branch - only exact fields
app.put('/api/branches/:id', function(req, res) {
  var branchId = req.params.id;
  var branch = req.body;
  
  var sql = `UPDATE branches SET 
             name = $1, university = $2, province = $3, 
             member_count = $4, alumni_count = $5 
             WHERE id = $6 
             RETURNING id, name, university, province, member_count, alumni_count`;
  
  var values = [
    branch.name,
    branch.university,
    branch.province,
    branch.member_count,
    branch.alumni_count,
    branchId
  ];

  database.query(sql, values, function(error, result) {
    if (error) {
      console.log('Error updating branch:', error);
      res.status(500).json({ error: 'Server error' });
    } else if (result.rows.length === 0) {
      res.status(404).json({ error: 'Branch not found' });
    } else {
      res.json(result.rows[0]);
    }
  });
});

// Dashboard statistics endpoint
app.get('/api/dashboard/stats', function(req, res) {
  // Get counts for dashboard
  var statsQueries = {
    totalUsers: 'SELECT COUNT(*) as count FROM users',
    totalEvents: 'SELECT COUNT(*) as count FROM events',
    totalBranches: 'SELECT COUNT(*) as count FROM branches',
    totalAlumni: 'SELECT COUNT(*) as count FROM alumni',
    totalNews: 'SELECT COUNT(*) as count FROM news',
    activeUsers: 'SELECT COUNT(*) as count FROM users WHERE status = $1',
    upcomingEvents: 'SELECT COUNT(*) as count FROM events WHERE date > $1'
  };

  // Execute all queries in parallel
  Promise.all([
    database.query(statsQueries.totalUsers, []),
    database.query(statsQueries.totalEvents, []),
    database.query(statsQueries.totalBranches, []),
    database.query(statsQueries.totalAlumni, []),
    database.query(statsQueries.totalNews, []),
    database.query(statsQueries.activeUsers, ['active']),
    database.query(statsQueries.upcomingEvents, [new Date().toISOString()])
  ]).then(results => {
    res.json({
      totalUsers: parseInt(results[0].rows[0].count),
      totalEvents: parseInt(results[1].rows[0].count),
      totalBranches: parseInt(results[2].rows[0].count),
      totalAlumni: parseInt(results[3].rows[0].count),
      totalNews: parseInt(results[4].rows[0].count),
      activeUsers: parseInt(results[5].rows[0].count),
      upcomingEvents: parseInt(results[6].rows[0].count)
    });
  }).catch(error => {
    console.log('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Server error' });
  });
});

// Handle undefined API routes
app.use('/api/*', function(req, res) {
  res.status(404).json({ error: 'API route not found' });
});

// Handle all other routes - serve signin page
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

// Error handling middleware
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT,'0.0.0.0' ,function() {
  console.log('Server started on port ' + PORT);
  console.log('Website: http://localhost:' + PORT);
  console.log('API: http://localhost:' + PORT + '/api');
  console.log('Stats Dashboard: http://localhost:' + PORT + '/stats');
});
