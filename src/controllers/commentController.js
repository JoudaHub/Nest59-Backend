const Comment = require('../models/Comment')
const Post    = require('../models/Post')

// ────────────────────────────────────────────────────────────────────────────
// POST /api/posts/:id/comments  — add a comment (or reply)
// ────────────────────────────────────────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const { content, parent_id } = req.body

    if (!content?.trim()) {
      return res.status(422).json({ success: false, message: 'Comment content is required.' })
    }
    if (content.trim().length > 5000) {
      return res.status(422).json({ success: false, message: 'Comment is too long (max 5000 chars).' })
    }

    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' })

    // Validate parent exists and belongs to the same post
    if (parent_id) {
      const parent = await Comment.findOne({ _id: parent_id, post_id: post._id })
      if (!parent) return res.status(404).json({ success: false, message: 'Parent comment not found.' })
    }

    const comment = await Comment.create({
      post_id:   post._id,
      user_id:   req.user._id,
      parent_id: parent_id || null,
      content:   content.trim(),
      is_ai:     false,
    })

    await Post.findByIdAndUpdate(post._id, { $inc: { comment_count: 1 } })

    const populated = await Comment.findById(comment._id)
      .populate('user_id', 'name lastname email')

    res.status(201).json({ success: true, comment: populated })
  } catch (err) {
    console.error('[addComment]', err)
    res.status(500).json({ success: false, message: 'Failed to add comment.' })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/comments/:id/like  — toggle like on a comment
// ────────────────────────────────────────────────────────────────────────────
const toggleCommentLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' })

    const uid     = req.user._id.toString()
    const hasLiked = comment.likes.map(String).includes(uid)

    if (hasLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== uid)
    } else {
      comment.likes.push(req.user._id)
    }

    await comment.save()
    res.json({ success: true, likes: comment.likes.length, liked: !hasLiked })
  } catch (err) {
    console.error('[toggleCommentLike]', err)
    res.status(500).json({ success: false, message: 'Failed to update like.' })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/comments/:id
// ────────────────────────────────────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' })

    if (!comment.user_id || comment.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this comment.' })
    }

    await Promise.all([
      comment.deleteOne(),
      Comment.deleteMany({ parent_id: comment._id }),   // delete replies too
      Post.findByIdAndUpdate(comment.post_id, { $inc: { comment_count: -1 } }),
    ])

    res.json({ success: true, message: 'Comment deleted.' })
  } catch (err) {
    console.error('[deleteComment]', err)
    res.status(500).json({ success: false, message: 'Failed to delete comment.' })
  }
}

module.exports = { addComment, toggleCommentLike, deleteComment }
