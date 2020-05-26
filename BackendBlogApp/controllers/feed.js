const { validationResult } = require('express-validator');

const Post = require('../models/post');
const clearImage = require('../utils/removeImage');

const getPosts = (req, res, next) => {
  const { page } = req.query || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Post.find()
        .skip((page - 1) * perPage)
        .limit(perPage);
    })
    .then(posts => {
      res.status(200).json({ posts, totalItems });
    })
    .catch(err => {
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
  if (!req.file) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }

  const { title, content } = req.body;

  const post = new Post({
    title,
    imageUrl: req.file.path,
    content,

    creator: {
      name: 'xxxx',
    },
  });
  post
    .save()
    .then(result => {
      // Create post in db
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

const updatePost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode(422);
    throw error;
  }

  const { postId } = req.params;
  const { title, content } = req.body;
  let { imageUrl } = req.body;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('no file picked');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post!');
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;

      return post
        .save()
        .then(result =>
          res.status(200).json({ message: 'Post updated!', post: result })
        );
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
const deletePost = (req, res, next) => {
  const { postId } = req.params;
  console.log('id', postId);
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post!');
        error.statusCode = 404;
        throw error;
      }
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      console.log('sksksskksks', result);
      res.status(200).json({ message: 'Deleted post' });
    })

    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
module.exports = {
  createPost,
  getPosts,
  getSinglePost,
  updatePost,
  deletePost,
};
