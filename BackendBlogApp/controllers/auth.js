const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { email, password, name } = req.body;
  console.log('signin', email, password, name);
  bcrypt
    .hash(password, 12)
    .then(hashedPass => {
      const user = new User({
        email,
        password: hashedPass,
        name,
      });
      return user.save();
    })
    .then(result => {
      res.status(200).json({ message: 'User Created', userId: result._id });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  let loadedUser;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        const error = new Error('User with email has not been found');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Wrong Password');
        error.statusCode(401);
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        'secret',
        { expiresIn: '1h' }
      );
      res.status(200).json({ token, userId: loadedUser._id.toString() });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
const getStatus = (req, res, next) => {
  const { userId } = req;

  return User.findById(userId)
    .then(user => {
      if (!user) {
        const error = new Error('User not found');
        error.statusCode(404);
        throw error;
      }
      console.log('user', user);
      res.status(200).json({ status: user.status });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const changeStatus = (req, res, next) => {
  const { userId } = req;
  const { status } = req.body;
  console.log('userId', userId);
  console.log('reqbody', req.body);
  User.findById(userId)
    .then(user => {
      if (!user) {
        const error = new Error('User with email has not been found');
        error.statusCode = 401;
        throw error;
      }
      user.status = status;
      return user.save();
    })
    .then(result => {
      res.status(200).json({ message: 'User status updated' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

module.exports = { signup, login, getStatus, changeStatus };
