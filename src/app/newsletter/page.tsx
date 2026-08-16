'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function NewsletterPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({ email })
      if (error && error.code !== '23505') throw error
      setSubmitted(true)
      toast.success('Subscribed successfully!')
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cranberry/10">
            <Mail className="h-8 w-8 text-cranberry" />
          </div>
          <CardTitle className="text-2xl text-navy">Newsletter Signup</CardTitle>
          <CardDescription>
            Stay updated with the latest news and events from Rotaract
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center">
              <Check className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <p className="text-lg font-medium text-navy">You&apos;re subscribed!</p>
              <p className="mt-2 text-sm text-gray-500">
                Thank you for subscribing to our newsletter.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full bg-cranberry text-white" disabled={loading}>
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
