const express = require('express');

const { getPosts, createPost } = require('../controllers/feed');

const router = express.Router();

// GET /feed/posts
router.get('/posts', getPosts);

// POST /feed/post,
router.post('/post', createPost);

module.exports = router;
