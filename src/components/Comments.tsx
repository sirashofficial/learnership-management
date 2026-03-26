'use client'

import React, { useState, useRef } from 'react'
import { Heart, MessageCircle, Send } from 'lucide-react'

interface Comment {
  id: string
  author: string
  authorId: string
  avatar: string
  content: string
  mentions: string[]
  date: Date
  likes: number
  replies: number
  isLiked: boolean
}

interface CommentsProps {
  comments: Comment[]
  onCommentSubmit: (text: string, mentions: string[]) => void
  isLoading?: boolean
}

export default function Comments({ comments, onCommentSubmit, isLoading }: CommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [mentionSearch, setMentionSearch] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const extractMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g
    const matches = text.match(mentionRegex) || []
    return matches.map(m => m.slice(1))
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
    
    // Check for @ mentions
    const lastChar = e.target.value[e.target.value.length - 1]
    if (lastChar === '@') {
      setShowMentions(true)
      setMentionSearch('')
    } else {
      setShowMentions(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      const mentions = extractMentions(newComment)
      onCommentSubmit(newComment, mentions)
      setNewComment('')
      setShowMentions(false)
    }
  }

  const toggleLike = (commentId: string) => {
    const newLiked = new Set(likedComments)
    if (newLiked.has(commentId)) {
      newLiked.delete(commentId)
    } else {
      newLiked.add(commentId)
    }
    setLikedComments(newLiked)
  }

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedReplies(newExpanded)
  }

  const formatDate = (date: Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return d.toLocaleDateString()
  }

  const renderCommentContent = (content: string, mentions: string[]) => {
    if (!mentions || mentions.length === 0) return content
    
    let result = content
    mentions.forEach(mention => {
      result = result.replace(
        `@${mention}`,
        `<span class="text-blue-600 font-medium">@${mention}</span>`
      )
    })
    return result
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 rounded w-full"></div>
              <div className="h-3 bg-slate-200 rounded w-4/5"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="space-y-3">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Share your thoughts... (use @name to mention someone)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          
          {/* Mention suggestions */}
          {showMentions && (
            <div className="bg-white border border-slate-200 rounded p-2 text-sm">
              <div className="text-slate-600 mb-2">Mention a person:</div>
              <div className="space-y-1">
                {['Alice Brown', 'Bob Smith', 'Carol Davis'].map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      const lastAtIndex = newComment.lastIndexOf('@')
                      const beforeMention = newComment.substring(0, lastAtIndex)
                      setNewComment(`${beforeMention}@${name.split(' ')[0]} `)
                      setShowMentions(false)
                    }}
                    className="block w-full text-left px-2 py-1 hover:bg-slate-100 rounded"
                  >
                    @{name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!newComment.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Post Comment
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="bg-white rounded-lg border border-slate-200 p-4">
              {/* Comment Header */}
              <div className="flex gap-3">
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{comment.author}</p>
                      <p className="text-xs text-slate-500">{formatDate(comment.date)}</p>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <p className="mt-2 text-slate-700 text-sm leading-relaxed">
                    {comment.mentions && comment.mentions.length > 0 ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: renderCommentContent(comment.content, comment.mentions)
                        }}
                      />
                    ) : (
                      comment.content
                    )}
                  </p>

                  {/* Comment Actions */}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <button
                      onClick={() => toggleLike(comment.id)}
                      className="flex items-center gap-1 text-slate-600 hover:text-red-600 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedComments.has(comment.id)
                            ? 'fill-red-600 text-red-600'
                            : ''
                        }`}
                      />
                      <span>{comment.likes + (likedComments.has(comment.id) ? 1 : 0)}</span>
                    </button>
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{comment.replies}</span>
                    </button>
                  </div>

                  {/* Replies (collapsed by default) */}
                  {expandedReplies.has(comment.id) && (
                    <div className="mt-4 pl-4 border-l-2 border-slate-200 space-y-3">
                      <p className="text-xs text-slate-500">
                        {comment.replies} {comment.replies === 1 ? 'reply' : 'replies'}
                      </p>
                      {/* Sample replies */}
                      <div className="bg-slate-50 rounded p-3">
                        <p className="font-sm text-slate-600">
                          <span className="font-medium">Mentor:</span> Great question! Keep exploring...
                        </p>
                        <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  )
}
