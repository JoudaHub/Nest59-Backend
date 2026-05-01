const express = require('express')
const router  = express.Router()

const {
  createPost,
  getFeed,
  getPost,
  getUserPosts,
  toggleLike,
  deletePost,
} = require('../controllers/postController')

const { addComment }  = require('../controllers/commentController')
const { protect }     = require('../middleware/auth')

// Feed & create
router.get('/', getFeed)
router.post('/', createPost)

// IMPORTANT: /user/:userId must come before /:id to avoid route conflict
router.get('/user/:userId',  protect, getUserPosts)

// Single post
router.get('/:id',protect, getPost)
router.delete('/:id',protect, deletePost)
router.post('/:id/like',protect, toggleLike)

// Comments on a post
router.post('/:id/comments', protect, addComment)

module.exports = router
