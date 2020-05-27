const express = require('express');
const { body } = require('express-validator');
const isAuth = require('../middleware/isAuth');

const {
  getPosts,
  createPost,
  getSinglePost,
  updatePost,
  deletePost,
} = require('../controllers/feed');

const router = express.Router();

// GET /feed/posts
router.get('/posts', isAuth, getPosts);

router.get('/post/:postId', isAuth, getSinglePost);

// POST /feed/post,
router.post(
  '/post',
  isAuth,
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
  isAuth,
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
router.delete('/post/:postId', isAuth, deletePost);
module.exports = router;
