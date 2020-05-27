const express = require('express');

const { body } = require('express-validator');
const {
  signup,
  login,
  getStatus,
  changeStatus,
} = require('../controllers/auth');
const User = require('../models/user');
const isAuth = require('../middleware/isAuth');

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
router.get('/status', isAuth, getStatus);
router.put(
  '/status',
  isAuth,
  [
    body('status')
      .trim()
      .not()
      .isEmpty(),
  ],
  changeStatus
);
module.exports = router;
