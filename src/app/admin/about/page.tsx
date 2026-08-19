'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface AboutData {
  hero_title: string
  hero_subtitle: string
  mission: string
  vision: string
  about_rotary_title: string
  about_rotary_text: string
  about_rotaract_title: string
  about_rotaract_text: string
  achievements_title: string
  achievements_subtitle: string
  achievements: { label: string; year: string }[]
  stats: { label: string; value: string }[]
  join_title: string
  join_subtitle: string
}

const defaultAbout: AboutData = {
  hero_title: 'About Rotaract',
  hero_subtitle: 'Empowering young leaders across Egypt to create positive change through service, professional development, and fellowship.',
  mission: 'To empower young professionals and students in Egypt to develop leadership skills, foster community service, and promote international understanding through the Rotaract movement.',
  vision: 'To be the leading youth organization in Egypt, creating a network of empowered young leaders who drive sustainable change in their communities and beyond.',
  about_rotary_title: 'About Rotary',
  about_rotary_text: 'Rotary International is a global network of 1.4 million neighbors, friends, and problem-solvers who see a world where people unite and take action to create lasting change.\n\nRotary focuses on seven areas of focus: Peace and conflict prevention, disease prevention and treatment, water and sanitation, maternal and child health, basic education and literacy, economic and community development, and supporting the environment.',
  about_rotaract_title: 'About Rotaract',
  about_rotaract_text: 'Rotaract brings together young leaders aged 18-30 to exchange ideas with leaders in the community, develop leadership and professional skills, and have fun through service.\n\nWe have clubs across Egypt that meet regularly to plan service projects, organize professional development workshops, and build lasting friendships.',
  achievements_title: 'District Achievements',
  achievements_subtitle: 'Milestones and recognition',
  achievements: [
    { label: 'Best District Award', year: '2024' },
    { label: 'Largest Cleanup Campaign', year: '2023' },
    { label: 'Community Impact Award', year: '2024' },
  ],
  stats: [
    { label: 'Active Clubs', value: '25' },
    { label: 'Total Members', value: '1200' },
    { label: 'Annual Events', value: '45' },
    { label: 'Years Active', value: '10' },
  ],
  join_title: 'Join the Movement',
  join_subtitle: 'Become part of a global network of young leaders making a difference.',
}

export default function AdminAboutPage() {
  const [form, setForm] = useState<AboutData>(defaultAbout)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadAbout()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAbout() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'about_page')
        .maybeSingle()
      if (data?.value && typeof data.value === 'object') {
        setForm({ ...defaultAbout, ...(data.value as Partial<AboutData>) })
      }
    } catch {
      toast.error('Failed to load about page content')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'about_page', value: form, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      if (error) throw error
      toast.success('About page updated')
      loadAbout()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function updateAchievement(index: number, field: 'label' | 'year', value: string) {
    setForm((f) => {
      const achievements = [...f.achievements]
      achievements[index] = { ...achievements[index], [field]: value }
      return { ...f, achievements }
    })
  }

  function addAchievement() {
    setForm((f) => ({ ...f, achievements: [...f.achievements, { label: '', year: '' }] }))
  }

  function removeAchievement(index: number) {
    setForm((f) => ({ ...f, achievements: f.achievements.filter((_, i) => i !== index) }))
  }

  function updateStat(index: number, field: 'label' | 'value', value: string) {
    setForm((f) => {
      const stats = [...f.stats]
      stats[index] = { ...stats[index], [field]: value }
      return { ...f, stats }
    })
  }

  function addStat() {
    setForm((f) => ({ ...f, stats: [...f.stats, { label: '', value: '' }] }))
  }

  function removeStat(index: number) {
    setForm((f) => ({ ...f, stats: f.stats.filter((_, i) => i !== index) }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">About Page</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">About Page</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">Title</label>
            <Input value={form.hero_title} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">Subtitle</label>
            <Textarea value={form.hero_subtitle} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} rows={5} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={form.vision} onChange={(e) => setForm({ ...form, vision: e.target.value })} rows={5} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">About Rotary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Title</label>
              <Input value={form.about_rotary_title} onChange={(e) => setForm({ ...form, about_rotary_title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Text</label>
              <Textarea value={form.about_rotary_text} onChange={(e) => setForm({ ...form, about_rotary_text: e.target.value })} rows={6} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">About Rotaract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Title</label>
              <Input value={form.about_rotaract_title} onChange={(e) => setForm({ ...form, about_rotaract_title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Text</label>
              <Textarea value={form.about_rotaract_text} onChange={(e) => setForm({ ...form, about_rotaract_text: e.target.value })} rows={6} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-navy">Achievements</CardTitle>
          <Button variant="outline" size="sm" onClick={addAchievement}><Plus className="mr-1 h-4 w-4" /> Add</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_100px_36px] gap-2 text-xs font-medium uppercase text-gray-400">
            <span>Achievement</span>
            <span>Year</span>
            <span />
          </div>
          {form.achievements.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_36px] gap-2">
              <Input value={a.label} onChange={(e) => updateAchievement(i, 'label', e.target.value)} placeholder="Award name" />
              <Input value={a.year} onChange={(e) => updateAchievement(i, 'year', e.target.value)} placeholder="2024" />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => removeAchievement(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-navy">Stats</CardTitle>
          <Button variant="outline" size="sm" onClick={addStat}><Plus className="mr-1 h-4 w-4" /> Add</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_100px_36px] gap-2 text-xs font-medium uppercase text-gray-400">
            <span>Label</span>
            <span>Value</span>
            <span />
          </div>
          {form.stats.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_36px] gap-2">
              <Input value={s.label} onChange={(e) => updateStat(i, 'label', e.target.value)} placeholder="Active Clubs" />
              <Input value={s.value} onChange={(e) => updateStat(i, 'value', e.target.value)} placeholder="25" />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => removeStat(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Join Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">Title</label>
            <Input value={form.join_title} onChange={(e) => setForm({ ...form, join_title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">Subtitle</label>
            <Textarea value={form.join_subtitle} onChange={(e) => setForm({ ...form, join_subtitle: e.target.value })} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
