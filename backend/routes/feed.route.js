const express = require('express');

const feedController = require('../controllers/feed.controller');
const isAuth = require('../middlewares/is-auth');

const router = express.Router();

//GET All Feeds --- /api/feed/posts
router.get('/posts', isAuth, feedController.getAllPosts)

//POST A Single Feed
router.post('/post', feedController.createPost)

//GET A Single Feed
router.get('/post/:postId', feedController.getSinglePost);

//PUT A Single Feed
router.put('/post/:postId', feedController.updatePost)

//DELETE A Single Feed
router.delete('/post/:postId', feedController.deletePost);

module.exports = router;