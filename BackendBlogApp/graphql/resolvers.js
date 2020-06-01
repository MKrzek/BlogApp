const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Post = require('../models/post');
const clearImage = require('../utils/removeImage');

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
  getPosts: async ({ page }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
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
  getSinglePost: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const post = await await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  updatePost: async ({ id, postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate('creator');
    console.log('found post', post);
    if (!post) {
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized!');
      error.code = 403;
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
    post.title = title;
    post.content = content;
    if (imageUrl !== 'undefined') {
      post.imageUrl = imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },
  deletePost: async ({ id }, req) => {
    console.log(id);
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id);
    console.log('delete-find', post);
    if (!post) {
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized!');
      error.code = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);
    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();
    return true;
  },
};
