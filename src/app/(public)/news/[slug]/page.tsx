import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getPostBySlug } from '@/lib/supabase/queries/posts.server'
import { getPublishedPosts } from '@/lib/supabase/queries/posts'
import { formatDate } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ShareButtons } from './ShareButtons'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'

function renderInlineContent(nodes: any[] | undefined): React.ReactNode {
  if (!nodes) return null
  return nodes.map((node, i) => {
    if (node.type !== 'text') return renderProseMirrorNode(node, i)
    let text: React.ReactNode = node.text
    for (const mark of node.marks || []) {
      switch (mark.type) {
        case 'bold':
          text = <strong key={i}>{text}</strong>
          break
        case 'italic':
          text = <em key={i}>{text}</em>
          break
        case 'strike':
          text = <s key={i}>{text}</s>
          break
        case 'code':
          text = <code key={i} className="rounded bg-gray-100 px-1">{text}</code>
          break
        case 'link':
          text = (
            <a key={i} href={mark.attrs?.href} className="text-cranberry no-underline hover:underline">
              {text}
            </a>
          )
          break
      }
    }
    return text
  })
}

function renderProseMirrorNode(node: any, key: number): React.ReactNode {
  if (!node) return null
  switch (node.type) {
    case 'doc':
      return node.content?.map((child: any, i: number) => renderProseMirrorNode(child, i))
    case 'paragraph':
      return <p key={key} className="mb-4">{renderInlineContent(node.content)}</p>
    case 'heading': {
      const HeadingTag = `h${node.attrs?.level || 2}` as React.ElementType
      return <HeadingTag key={key} className="mb-3 mt-6 font-bold text-navy">{renderInlineContent(node.content)}</HeadingTag>
    }
    case 'bulletList':
      return (
        <ul key={key} className="mb-4 ml-6 list-disc space-y-1">
          {node.content?.map((child: any, i: number) => renderProseMirrorNode(child, i))}
        </ul>
      )
    case 'orderedList':
      return (
        <ol key={key} className="mb-4 ml-6 list-decimal space-y-1">
          {node.content?.map((child: any, i: number) => renderProseMirrorNode(child, i))}
        </ol>
      )
    case 'listItem':
      return <li key={key}>{node.content?.map((child: any, i: number) => renderProseMirrorNode(child, i))}</li>
    case 'blockquote':
      return (
        <blockquote key={key} className="mb-4 border-l-4 border-gold bg-gold/5 py-3 pl-4 italic text-gray-600">
          {node.content?.map((child: any, i: number) => renderProseMirrorNode(child, i))}
        </blockquote>
      )
    case 'codeBlock':
      return (
        <pre key={key} className="mb-4 overflow-x-auto rounded-xl bg-navy p-4 text-sm text-white">
          <code>{renderInlineContent(node.content)}</code>
        </pre>
      )
    case 'horizontalRule':
      return <hr key={key} className="my-6" />
    case 'hardBreak':
      return <br key={key} />
    case 'image':
      return (
        <figure key={key} className="mb-6">
          <img src={node.attrs?.src} alt={node.attrs?.alt || ''} className="rounded-2xl" />
          {node.attrs?.title && <figcaption className="mt-2 text-center text-sm text-gray-500">{node.attrs.title}</figcaption>}
        </figure>
      )
    default:
      return node.content?.map((child: any, i: number) => renderProseMirrorNode(child, i))
  }
}

function renderRichContent(content: any) {
  if (typeof content === 'string') {
    return <div className="leading-relaxed text-gray-700 whitespace-pre-line">{content}</div>
  }
  if (!content || typeof content !== 'object') return null
  if (content.__html) {
    return <div className="leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: content.__html }} />
  }
  if (content.blocks) {
    return content.blocks.map((block: any, i: number) => {
      if (block.type === 'paragraph') {
        return <p key={i} className="mb-4">{block.data.text}</p>
      }
      if (block.type === 'header') {
        const Tag = block.data.level === 1 ? 'h1' : block.data.level === 2 ? 'h2' : 'h3'
        return <Tag key={i} className="mb-3 mt-6 font-bold text-navy">{block.data.text}</Tag>
      }
      if (block.type === 'image') {
        return (
          <figure key={i} className="mb-6">
            <img src={block.data.file?.url || block.data.url} alt={block.data.caption || ''} className="rounded-2xl" />
            {block.data.caption && <figcaption className="mt-2 text-center text-sm text-gray-500">{block.data.caption}</figcaption>}
          </figure>
        )
      }
      if (block.type === 'list') {
        const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul'
        return (
          <ListTag key={i} className="mb-4 ml-6 list-disc space-y-1">
            {block.data.items?.map((item: string, j: number) => (
              <li key={j}>{item}</li>
            ))}
          </ListTag>
        )
      }
      if (block.type === 'quote') {
        return (
          <blockquote key={i} className="mb-4 border-l-4 border-gold bg-gold/5 py-3 pl-4 italic text-gray-600">
            {block.data.text}
            {block.data.caption && <footer className="mt-1 text-sm not-italic text-gray-400">- {block.data.caption}</footer>}
          </blockquote>
        )
      }
      return null
    })
  }
  if (Array.isArray(content.content) || content.type) {
    return <div className="leading-relaxed text-gray-700">{renderProseMirrorNode(content, 0)}</div>
  }
  return null
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const post = await getPostBySlug(slug)
    return {
      title: post.title,
      description: post.excerpt || undefined,
      openGraph: {
        title: post.title,
        description: post.excerpt || undefined,
        images: post.cover_url ? [{ url: post.cover_url }] : [],
      },
    }
  } catch {
    return { title: 'Article Not Found' }
  }
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params
  let post
  try {
    post = await getPostBySlug(slug)
  } catch {
    notFound()
  }

  const relatedPosts = await getPublishedPosts({ limit: 3 }).catch(() => [])

  const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rotaractd2451.org'}/news/${slug}`

  return (
    <div className="flex flex-col">
      <article className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/news" className="flex items-center gap-1 text-gray-500">
                <ArrowLeft className="h-4 w-4" />
                Back to News
              </Link>
            </Button>
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  {post.tags?.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                  {post.is_announcement && (
                    <Badge variant="cranberry">Announcement</Badge>
                  )}
                </div>
                <h1 className="mb-4 text-3xl font-bold text-navy md:text-4xl">{post.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  {post.author && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author.avatar_url} />
                        <AvatarFallback>{post.author.full_name?.charAt(0) || 'A'}</AvatarFallback>
                      </Avatar>
                      <span>{post.author.full_name}</span>
                    </div>
                  )}
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.published_at)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.views || 0} views
                  </span>
                </div>
              </div>

              {post.cover_url && (
                <div className="relative mb-8 h-[400px] overflow-hidden rounded-2xl">
                  <Image src={post.cover_url} alt={post.title} fill className="object-cover" priority />
                </div>
              )}

              <div className="prose prose-gray max-w-none">
                {renderRichContent(post.content)}
              </div>

              <div className="mt-8">
                <Separator className="mb-6" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-gray-500">Share this article:</p>
                    <ShareButtons url={articleUrl} title={post.title} />
                  </div>
                </div>
              </div>

              {post.author && (
                <div className="mt-8 rounded-2xl border bg-gray-50 p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={post.author.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-navy to-cranberry text-lg text-white">
                        {post.author.full_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-navy">{post.author.full_name}</h3>
                      {post.author.bio && (
                        <p className="mt-1 text-sm text-gray-500">{post.author.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-navy">Related Articles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedPosts
                    .filter((p) => p.id !== post.id)
                    .slice(0, 3)
                    .map((rp) => (
                      <Link key={rp.id} href={`/news/${rp.slug}`} className="group block">
                        <div className="flex gap-3">
                          {rp.cover_url && (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                              <Image src={rp.cover_url} alt={rp.title} fill className="object-cover" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium text-navy group-hover:text-cranberry">
                              {rp.title}
                            </p>
                            {rp.published_at && (
                              <p className="mt-0.5 text-xs text-gray-400">{formatDate(rp.published_at)}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </article>
    </div>
  )
}
