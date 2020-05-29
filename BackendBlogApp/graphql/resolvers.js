const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Post = require('../models/post');

module.exports = {
  createUser: async (args, req) => {
    const { email, name, password } = args.userInput;

    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: 'E-mail is invalid' });
    }
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({ message: 'Password too short' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = User.findOne({ email });

    if (existingUser.data) {
      const error = new Error('User exists already!');
      throw error;
    }
    const hashedPass = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      name,
      password: hashedPass,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async args => {
    const user = await User.findOne({ email: args.email });
    if (!user) {
      const error = new Error('User not found');
      error.code = 401;
      throw error;
    }
    console.log('user', user);
    const { _id, email, password } = user;
    const isEqual = await bcrypt.compare(args.password, password);
    if (!isEqual) {
      const error = new Error('Password is incorrect');
      error.code = 401;
      throw error;
    }

    const token = jwt.sign({ userId: _id.toString(), email }, 'secret', {
      expiresIn: '1h',
    });
    return { token, userId: _id.toString() };
  },
};
