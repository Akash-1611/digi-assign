const { getDatabase } = require('../config/db');

/**
 * Handle user login
 * @route POST /api/login
 */
const login = (req, res) => {
  const { mobile, pin } = req.body;
  const db = getDatabase();
  
  const user = db.users.find(u => u.mobile === mobile && u.pin === pin);
  
  if (user) {
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name, 
        role: user.role, 
        mobile: user.mobile 
      }
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials' 
    });
  }
};

module.exports = {
  login
};

