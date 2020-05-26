const express = require('express');

const { body } = require('express-validator');
const { signup, login } = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.put(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) =>
        User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('Email address already exists!');
          }
        })
      )
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min: 5 }),
    body('name')
      .trim()
      .not()
      .isEmpty(),
  ],
  signup
);
router.post('/login', login);
module.exports = router;
