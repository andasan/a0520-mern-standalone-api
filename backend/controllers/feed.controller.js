const fs = require('fs')
const path = require('path')
const { validationResult } = require('express-validator')

const io = require('../socket');
const Post = require('../models/feed.model')
const User = require('../models/user.model')

exports.getAllPosts = async (req, res, next) => {
  const perPage = 10

  const totalItems = await Post.find().countDocuments()
  const posts = await Post.find().populate('creator').limit(perPage)

  res.status(200).json({
    message: totalItems > 0 ? 'Fetched posts successfully.' : 'No posts found',
    posts,
    totalItems,
  })
}

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.')
    error.statusCode = 422
    throw error
  }

  if (!req.file) {
    const error = new Error('No image provided')
    error.statusCode = 422
    throw error
  }

  const { title, content } = req.body
  const post = new Post({
    title,
    content,
    image: req.file.path,
    creator: req.userId,
  })

  await post.save()
  const user = await User.findById(req.userId)
  user.posts.push(post)
  await user.save()

  io.getIO().emit("posts", {
    action: "create",
    post: { post, creator: req.userId }
  })

  res.status(201).json({
    message: 'Post created successfully!',
    post,
    creator: { _id: user._id, name: user.name },
  })
  // clearImage(image) //clear uploaded image
}

exports.getSinglePost = async (req, res, next) => {
  const postId = req.params.postId

  const post = await Post.findById(postId)

  if (!post) {
    const error = new Error('Could not find post')
    error.statusCode = 404
    throw error
  }
  res.status(200).json({ message: 'Post fetched', post })
}

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect')
    error.statusCode = 422
    throw error
  }

  const { title, content } = req.body
  const image = req.file.path

  if (!req.file) {
    const error = new Error('No image provided')
    error.statusCode = 422
    throw error
  }

  const post = await Post.findById(postId).populate('creator')
  if (!post) {
    const error = new Error('Could not find post with that ID')
    error.statusCode = 404
    throw error
  }
  if (post.creator.id !== req.userId) {
    const error = new Error('Not Authorized to Update Post')
    error.statusCode = 403
    throw error
  }
  if (image !== post.image) {
    clearImage(post.image)
  }

  post.title = title
  post.image = image
  post.content = content
  const result = await post.save()

  io.getIO().emit("posts", { 
    action: "update", 
    post: result
  })
  res.status(200).json({ message: 'Post Updated!', post: result })

  // clearImage(image) //clear uploaded image
}

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId
  const post = await Post.findById(postId)

  if (!post) {
    const error = new Error('Could not find post with that ID')
    error.statusCode = 404
    throw error
  }
  if (post.creator.toString() !== req.userId) {
    const error = new Error('Not Authorized to Delete post')
    error.statusCode = 403
    throw error
  }
  clearImage(post.image)
  await Post.findByIdAndRemove(postId)

  const user = await User.findById(req.userId)
  user.posts.pull(postId)
  await user.save()

  io.getIO().emit("posts", {
    action: "delete",
    post: postId
  })
  res.status(200).json({ message: 'Deleted Post!' })
}

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath)
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log('Unlink err: ', err)
    }
  })
}
