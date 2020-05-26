const express = require('express');
const { body } = require('express-validator');

const {
  getPosts,
  createPost,
  getSinglePost,
  updatePost,
} = require('../controllers/feed');

const router = express.Router();

// GET /feed/posts
router.get('/posts', getPosts);

router.get('/post/:postId', getSinglePost);

// POST /feed/post,
router.post(
  '/post',
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 }),
  ],
  createPost
);
router.put(
  '/post/:postId',
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 }),
  ],
  updatePost
);
module.exports = router;
