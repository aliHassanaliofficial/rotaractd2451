'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { deleteLibraryItem } from '@/lib/supabase/queries/library'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Plus, Search, Edit, Trash2, Download, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { LibraryItem, LibraryCategory } from '@/types/database'

export default function AdminLibraryPage() {
  const [items, setItems] = useState<(LibraryItem & { category?: LibraryCategory })[]>([])
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadItems() }, [categoryFilter])

  async function loadItems() {
    setLoading(true)
    try {
      const [catRes] = await Promise.all([
        supabase.from('library_categories').select('*').order('sort_order'),
      ])
      setCategories(catRes.data || [])

      let query = supabase
        .from('library_items')
        .select('*, category:category_id(*)')
        .order('created_at', { ascending: false })

      if (categoryFilter !== 'all') query = query.eq('category_id', categoryFilter)

      const { data, error } = await query
      if (error) throw error
      setItems(data || [])
    } catch {
      toast.error('Failed to load library')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteLibraryItem(id)
      toast.success('Item deleted')
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const filtered = items.filter((i) =>
    i.title.toLowerCase().includes(search.toLowerCase())
  )

  const typeColors: Record<string, string> = {
    pdf: 'bg-red-100 text-red-700',
    document: 'bg-blue-100 text-blue-700',
    image: 'bg-green-100 text-green-700',
    video: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Library</h1>
        <Link href="/admin/library/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Downloads</th>
                  <th className="px-6 py-4">Published</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4" colSpan={6}><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No library items found</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-navy">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium capitalize', typeColors[item.type] || 'bg-gray-100')} variant="outline">
                          {item.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{item.category?.name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{item.downloads || 0}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn(item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')} variant="outline">
                          {item.is_published ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.file_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={item.file_url} target="_blank" rel="noopener noreferrer" title="Download">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Dialog open={deleteId === item.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteId(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Item</DialogTitle>
                                <DialogDescription>Are you sure?</DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => handleDelete(item.id)} disabled={deleting}>
                                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
