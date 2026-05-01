const express = require('express')
const router  = express.Router()

const { toggleCommentLike, deleteComment } = require('../controllers/commentController')
const { protect } = require('../middleware/auth')

// POST /api/comments/:id/like
router.post('/:id/like', protect, toggleCommentLike)

// DELETE /api/comments/:id
router.delete('/:id',    protect, deleteComment)

module.exports = router
