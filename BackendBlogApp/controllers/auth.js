const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { email, password, name } = req.body;
  try {
    const hashedPass = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPass,
      name,
    });
    const result = await user.save();
    res.status(200).json({ message: 'User Created', userId: result._id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('User with email has not been found');
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    const isEqual = bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error('Wrong Password');
      error.statusCode = 401;
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
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
const getStatus = async (req, res, next) => {
  const { userId } = req;
  try {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ status: user.status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const changeStatus = async (req, res, next) => {
  const { userId } = req;
  const { status } = req.body;
  console.log('userId', userId);
  console.log('reqbody', req.body);
  const user = await User.findById(userId);
  try {
    if (!user) {
      const error = new Error('User with email has not been found');
      error.statusCode = 401;
      throw error;
    }
    user.status = status;
    await user.save();

    res.status(200).json({ message: 'User status updated' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

module.exports = { signup, login, getStatus, changeStatus };
