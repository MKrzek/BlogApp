const { validationResult } = require('express-validator');
const Post = require('../models/post');

const getPosts = (req, res, next) => {
  Post.find()
    .then(posts => {
      console.log('posts', posts);
      res.status(200).json({ posts });
    })
    .catch(err => {
      console.log(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const getSinglePost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post!');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ post });
    })
    .catch(err => {
      console.log(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const createPost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode(422);
    throw error;
  }

  const { title, content } = req.body;
  const post = new Post({
    title,
    imageUrl: 'xxxxxx.jpg',
    content,

    creator: {
      name: 'xxxx',
    },
  });
  post
    .save()
    .then(result => {
      // Create post in db
      console.log('result', result);
      res.status(201).json({ post: result });
    })
    .catch(err => {
      console.log(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

module.exports = { createPost, getPosts, getSinglePost };
