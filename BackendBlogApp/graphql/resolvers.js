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

  createPost: async ({ postInput }, req) => {
    console.log('reqqqq', req);
    console.log('xxxxxpostInput', postInput, req.userId);
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: 'Title is invalid' });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    console.log('user', user);
    if (!user) {
      const error = new Error('User not found');
      error.data = errors;
      error.code = 401;
      throw error;
    }
    const post = new Post({
      title,
      content,
      imageUrl,
      creator: user,
    });

    const createdPost = await post.save();
    console.log('createdPost', createdPost);
    user.posts.push(createdPost);
    await user.save();
    const { _id, createdAt, updatedAt } = createdPost;
    return {
      ...createdPost._doc,
      _id: _id.toString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  },
  getPosts: async (args, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('creator');

    return {
      posts: posts.map(p => ({
        ...p._doc,
        _id: p._id.toString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      totalPosts,
    };
  },
};
