const mongoose = require('mongoose')

const postSchema = new mongoose.Schema(
  {
    user_id: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Post must belong to a user'],
    },
    title: {
      type:      String,
      trim:      true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      default:   '',
    },
    code: {
      type:      String,
      required:  [true, 'Code snippet is required'],
      maxlength: [20000, 'Code snippet is too long'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default:   '',
    },
    language: {
      type:    String,
      trim:    true,
      default: 'plaintext',
    },
    likes: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ],
    comment_count: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

postSchema.index({ created_at: -1 })
postSchema.index({ user_id: 1, created_at: -1 })

module.exports = mongoose.model('Post', postSchema)
