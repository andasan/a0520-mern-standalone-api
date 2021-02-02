const express = require('express');

const User = require('../models/user.model');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/signup', authController.signup); //  --> /api/auth/signup

router.post('/login', authController.login);

module.exports = router;