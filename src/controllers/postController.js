const Post    = require('../models/Post')
const Comment = require('../models/Comment')
const { analyseCode } = require('../services/aiService')

// ── Helper: populate author ───────────────────────────────────────────────────
const withAuthor = (id) =>
  Post.findById(id).populate('user_id', 'name lastname email')

// ── Background AI comment (fire-and-forget) ───────────────────────────────────
const generateAIComment = async (postId, code, description, language) => {
  try {
    const text = await analyseCode(code, description, language)
    const comment = await Comment.create({
      post_id: postId,
      user_id: null,
      content: text,
      is_ai:   true,
    })
    await Post.findByIdAndUpdate(postId, { $inc: { comment_count: 1 } })
    console.log(`🤖  AI comment saved for post ${postId}`)
    return comment
  } catch (err) {
    console.error(`[AI] Failed for post ${postId}:`, err.message)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/posts  — create a post, trigger AI in background
// ────────────────────────────────────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const { title, code, description, language } = req.body

    if (!code?.trim()) {
      return res.status(422).json({ success: false, message: 'Code snippet is required.' })
    }

    const post = await Post.create({
      user_id:     req.user._id,
      title:       title?.trim() || '',
      code:        code.trim(),
      description: description?.trim() || '',
      language:    language?.trim() || 'plaintext',
    })

    // Respond immediately — don't block the client on Gemini
    res.status(201).json({ success: true, post: await withAuthor(post._id) })

    // AI runs after response is sent
    generateAIComment(post._id, code, description, language)
  } catch (err) {
    console.error('[createPost]', err)
    res.status(500).json({ success: false, message: 'Failed to create post.' })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/posts  — paginated feed, newest first
// ────────────────────────────────────────────────────────────────────────────
const getFeed = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(20, parseInt(req.query.limit) || 10)
    const skip  = (page - 1) * limit

    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name lastname email'),
      Post.countDocuments(),
    ])

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages:   Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    })
  } catch (err) {
    console.error('[getFeed]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch posts.' })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/posts/:id  — single post + all its comments
// ────────────────────────────────────────────────────────────────────────────
const getPost = async (req, res) => {
  try {
    const post = await withAuthor(req.params.id)
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' })

    // AI comment floats to top, then chronological
    const comments = await Comment.find({ post_id: post._id })
      .sort({ is_ai: -1, created_at: 1 })
      .populate('user_id', 'name lastname email')

    res.json({ success: true, post, comments })
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' })
    }
    console.error('[getPost]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch post.' })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/posts/user/:userId  — all posts by a user
// ────────────────────────────────────────────────────────────────────────────
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user_id: req.params.userId })
      .sort({ created_at: -1 })
      .populate('user_id', 'name lastname email')

    res.json({ success: true, posts })
  } catch (err) {
    console.error('[getUserPosts]', err)
    res.status(500).json({ success: false, message: 'Failed to fetch user posts.' })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/posts/:id/like  — toggle like
// ────────────────────────────────────────────────────────────────────────────
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' })

    const uid     = req.user._id.toString()
    const hasLiked = post.likes.map(String).includes(uid)

    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== uid)
    } else {
      post.likes.push(req.user._id)
    }

    await post.save()
    res.json({ success: true, likes: post.likes.length, liked: !hasLiked })
  } catch (err) {
    console.error('[toggleLike]', err)
    res.status(500).json({ success: false, message: 'Failed to update like.' })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/posts/:id  — only the post owner can delete
// ────────────────────────────────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' })

    if (post.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this post.' })
    }

    await Promise.all([
      post.deleteOne(),
      Comment.deleteMany({ post_id: post._id }),
    ])

    res.json({ success: true, message: 'Post deleted.' })
  } catch (err) {
    console.error('[deletePost]', err)
    res.status(500).json({ success: false, message: 'Failed to delete post.' })
  }
}

module.exports = { createPost, getFeed, getPost, getUserPosts, toggleLike, deletePost }
