const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controllers/feed.controller");
const isAuth = require("../middlewares/is-auth");
const fileUpload = require("../middlewares/file-upload");

const router = express.Router();

router.use(isAuth);

//GET All Feeds --- /api/feed/posts
router.get("/posts", feedController.getAllPosts);

//POST A Single Feed
router.post(
  "/post",
  fileUpload.single("image"),
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

//GET A Single Feed
router.get("/post/:postId", feedController.getSinglePost);

//PUT A Single Feed
router.put(
  "/post/:postId",
  fileUpload.single("image"),
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);

//DELETE A Single Feed
router.delete("/post/:postId", feedController.deletePost);

module.exports = router;
