'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[]
  maxTags?: number
  className?: string
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag...',
  suggestions = [],
  maxTags = 20,
  className,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return
    onChange([...tags, trimmed])
    setInput('')
    setShowSuggestions(false)
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  )

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className="flex min-h-[2.25rem] flex-wrap items-center gap-1.5 rounded-2xl border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus-within:ring-1 focus-within:ring-navy"
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-navy to-rotary-blue px-2.5 py-0.5 text-xs font-medium text-white"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 transition-colors hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length < maxTags ? placeholder : 'Max tags reached'}
          disabled={tags.length >= maxTags}
          className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-gray-400 disabled:opacity-50"
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {tags.length}/{maxTags} tags. Press Enter or comma to add.
      </p>
    </div>
  )
}
