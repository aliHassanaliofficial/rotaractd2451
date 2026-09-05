'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Accordion from '@radix-ui/react-accordion'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Mail, Phone, MapPin, ChevronDown, Send, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

const faqs = [
  { q: 'How can I join Rotaract?', a: 'You can join by visiting any of our active clubs in Egypt. Find a club near you on our Clubs page and reach out to their membership director.' },
  { q: 'Who can join Rotaract?', a: 'Rotaract is open to young adults aged 18-30 who are interested in community service, professional development, and leadership.' },
  { q: 'How many clubs are there?', a: 'There are numerous active clubs across Egypt, each working on unique service projects and professional development activities.' },
  { q: 'How can I start a new Rotaract club?', a: 'To start a new club, you need at least 15 members, a sponsoring Rotary club, and approval from the District Rotaract Committee.' },
  { q: 'What types of events does Rotaract organize?', a: 'Rotaract organizes service projects, professional development workshops, social events, conferences, and fundraising activities.' },
  { q: 'Can I attend events from other clubs?', a: 'Yes! All Rotaract events are open to members across the district. Check our events page for upcoming activities.' },
]

export default function ContactPage() {
  const { settings } = useSiteSettings()
  const contact = settings.contact_info || {}
  const email = contact.email || 'info@rotaract2451.org'
  const phone = contact.phone || '+20 100 000 0000'
  const location = contact.address || 'Egypt'
  const mapEmbed = contact.map_embed_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.789!2d31.2357!3d30.0444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDAyJzQwLjAiTiAzMcKwMTQnMDguNSJF!5e0!3m2!1sen!2seg!4v1'
  const [submitted, setSubmitted] = useState(false)
  const [faqOpen, setFaqOpen] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSubmitted(true)
      reset()
    } catch {
      setSubmitted(false)
    }
  }

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Contact Us</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Have questions? We&apos;d love to hear from you. Get in touch.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-navy">Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form and we&apos;ll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center py-12 text-center"
                    >
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-navy">Message Sent!</h3>
                      <p className="mb-6 text-gray-500">Thank you for reaching out. We&apos;ll respond shortly.</p>
                      <Button variant="outline" onClick={() => setSubmitted(false)}>
                        Send Another Message
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Name <span className="text-cranberry">*</span>
                          </label>
                          <Input placeholder="Your name" {...register('name')} />
                          {errors.name && (
                            <p className="mt-1 text-xs text-cranberry">{errors.name.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Email <span className="text-cranberry">*</span>
                          </label>
                          <Input type="email" placeholder="your@email.com" {...register('email')} />
                          {errors.email && (
                            <p className="mt-1 text-xs text-cranberry">{errors.email.message}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                        <Input placeholder="What's this about?" {...register('subject')} />
                        {errors.subject && (
                          <p className="mt-1 text-xs text-cranberry">{errors.subject.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Message <span className="text-cranberry">*</span>
                        </label>
                        <Textarea
                          rows={6}
                          placeholder="Tell us more about your inquiry..."
                          {...register('message')}
                        />
                        {errors.message && (
                          <p className="mt-1 text-xs text-cranberry">{errors.message.message}</p>
                        )}
                      </div>
                      <Button type="submit" className="bg-cranberry text-white hover:bg-cranberry/90" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-1 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-navy">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <p className="text-sm font-medium text-navy">Email</p>
                      <a href={`mailto:${email}`} className="text-sm text-gray-500 hover:text-cranberry">
                        {email}
                      </a>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <p className="text-sm font-medium text-navy">Phone</p>
                      <p className="text-sm text-gray-500">{phone}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <p className="text-sm font-medium text-navy">Location</p>
                      <p className="text-sm text-gray-500">{location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-hidden rounded-2xl border">
                <iframe
                  src={mapEmbed}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="District Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold text-navy">Frequently Asked Questions</h2>
            <p className="text-gray-500">Quick answers to common questions</p>
          </div>
          <div className="mx-auto max-w-3xl">
            <Accordion.Root
              type="multiple"
              value={faqOpen}
              onValueChange={setFaqOpen}
              className="space-y-3"
            >
              {faqs.map((faq, i) => {
                const isOpen = faqOpen.includes(`faq-${i}`)
                return (
                  <Accordion.Item key={i} value={`faq-${i}`}>
                    <Accordion.Header>
                      <Accordion.Trigger className="flex w-full items-center justify-between rounded-2xl border bg-white p-4 text-left text-sm font-medium text-navy shadow-sm transition-all hover:border-gold/30 data-[state=open]:border-gold/30">
                        {faq.q}
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 text-gold transition-transform duration-200',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                      <div className="px-4 pb-4 pt-2 text-sm text-gray-600">
                        {faq.a}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                )
              })}
            </Accordion.Root>
          </div>
        </div>
      </section>
    </div>
  )
}
