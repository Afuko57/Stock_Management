// auth.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and generate access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             example:
 *               token: "your_generated_token_here"
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Internal Server Error
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  pool.query('SELECT * FROM Users WHERE username = ?', [username], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  });
});

module.exports = router;
