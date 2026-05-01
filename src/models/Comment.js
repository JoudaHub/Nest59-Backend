const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
  {
    post_id: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Post',
      required: [true, 'Comment must belong to a post'],
    },
    // null when is_ai = true
    user_id: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    // null = top-level, ObjectId = reply to another comment
    parent_id: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Comment',
      default: null,
    },
    content: {
      type:      String,
      required:  [true, 'Comment content is required'],
      trim:      true,
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
    },
    is_ai: {
      type:    Boolean,
      default: false,
    },
    likes: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

commentSchema.index({ post_id: 1, created_at: 1 })
commentSchema.index({ parent_id: 1 })

module.exports = mongoose.model('Comment', commentSchema)
