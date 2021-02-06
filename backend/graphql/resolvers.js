const bcrypt = require('bcryptjs')
const validator = require('validator')
const jwt = require('jsonwebtoken')

const User = require('../models/user.model')
const Post = require('../models/feed.model')
const { clearImage } = require('../util/file')

module.exports = {
  createUser: async function ({ userInput }, req) {
    const errors = []
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'Email is invalid' })
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Password too short' })
    }
    if (errors.length > 0) {
      const error = new Error('Invalid Input')
      error.data = errors
      error.code = 422
      throw error
    }

    const existingUser = await User.findOne({ email: userInput.email })
    if (existingUser) {
      const error = new Error('User exists already!')
      error.code = 401
      throw error
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12)
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
    })
    const createdUser = await user.save()
    return { ...createdUser._doc, _id: createdUser._id.toString() }
  },

  login: async function ({ email, password }, req) {
    const user = await User.findOne({ email: email })
    if (!user) {
      const error = new Error('User not found.')
      error.code = 401
      throw error
    }
    const isEqual = await bcrypt.compare(password, user.password)
    if (!isEqual) {
      const error = new Error('Password is incorrect')
      error.code = 401
      throw error
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    return { token, userId: user._id.toString() }
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!')
      error.code = 401
      throw error
    }

    const errors = []
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid' })
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid' })
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input')
      error.data = errors
      error.code = 422
      throw error
    }

    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error('Invalid user')
      error.code = 401
      throw error
    }

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      image: postInput.image,
      creator: user,
    })

    const createdPost = await post.save()
    user.posts.push(createdPost)
    await user.save()

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updateAt: createdPost.updatedAt.toISOString(),
    }
  },

  posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!')
      error.code = 401
      throw error
    }

    if (!page) {
      page = 1
    }
    const perPage = 4

    const totalPosts = await Post.find().countDocuments()
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('creator')

    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updateAt: p.updatedAt.toISOString(),
        }
      }),
      totalPosts: totalPosts,
    }
  },

  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated')
      error.code = 401
      throw error
    }

    const post = await Post.findById(id).populate('creator')
    if (!post) {
      const error = new Error('No post found')
      error.code = 404
      throw error
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }
  },

  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated')
      error.code = 401
      throw error
    }

    const post = await Post.findById(id).populate('creator')
    if (!post) {
      const error = new Error('Post not found')
      error.code = 401
      throw error
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized to update')
      error.code = 403
      throw error
    }

    const errors = []
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      error.push({ message: 'Title is invalid.' })
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      error.push({ message: 'Content is invalid.' })
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.')
      error.data = errors
      error.code = 422
      throw error
    }

    post.title = postInput.title
    post.content = postInput.content
    if (postInput.image !== 'undefined') {
      post.image = postInput.image
    }
    const updatedPost = await post.save()

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    }
  },

  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated')
      error.code = 401
      throw error
    }
    const post = await Post.findById(id)
    if (!post) {
      const error = new Error('No post found')
      error.code = 404
      throw error
    }

    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not authorzied to delete!')
      error.code = 403
      throw error
    }

    clearImage(post.image)
    await Post.findByIdAndRemove(id)
    const user = await User.findById(req.userId)
    user.posts.pull(id)
    await user.save()

    return true
  },
}
