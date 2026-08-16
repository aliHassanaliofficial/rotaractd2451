'use client'

import { useRef, useCallback } from 'react'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight = 200,
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  return (
    <div className={cn('rounded-2xl border', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-gray-50 px-2 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec('formatBlock', '<h1>')}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec('formatBlock', '<h2>')}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec('insertUnorderedList')}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec('insertOrderedList')}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec('formatBlock', '<blockquote>')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="prose prose-sm max-w-none p-4 outline-none focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  )
}
