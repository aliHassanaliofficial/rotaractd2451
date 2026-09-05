import dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import slugify from 'slugify'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: WebSocket },
})

async function seed() {
  console.log('Seeding Rotaract District 2451 database...')

  // 1. Create superadmin user
  const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
    email: 'admin@rotaractd2451.org',
    password: 'Admin@2451!',
    email_confirm: true,
  })

  if (adminError) {
    console.error('Error creating admin:', adminError.message)
  } else {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: adminUser.user.id,
      full_name: 'District Admin',
      email: 'admin@rotaractd2451.org',
      role: 'superadmin',
      is_active: true,
      is_verified: true,
    })
    if (profileError) console.error('Error creating admin profile:', profileError.message)
    else console.log('✓ Superadmin created')
  }

  // 2. Create sample clubs
  const clubs = [
    { name: 'Rotaract Club of Cairo University', charter_date: '2015-09-01', university: 'Cairo University', city: 'Cairo', member_count: 45 },
    { name: 'Rotaract Club of Alexandria', charter_date: '2016-03-15', university: 'Alexandria University', city: 'Alexandria', member_count: 38 },
    { name: 'Rotaract Club of GUC', charter_date: '2018-01-20', university: 'German University in Cairo', city: 'Cairo', member_count: 52 },
    { name: 'Rotaract Club of AUC', charter_date: '2017-06-10', university: 'American University in Cairo', city: 'Cairo', member_count: 41 },
    { name: 'Rotaract Club of Mansoura', charter_date: '2019-11-05', university: 'Mansoura University', city: 'Mansoura', member_count: 29 },
  ]

  const createdClubs: any[] = []
  for (const club of clubs) {
    const { data, error } = await supabase.from('clubs').upsert({
      ...club,
      slug: slugify(club.name, { lower: true, strict: true }),
      description: `The ${club.name} is dedicated to community service and professional development.`,
      mission: 'To empower young leaders through service and fellowship.',
      vision: 'A world where people unite and take action to create lasting change.',
      is_active: true,
      country: 'Egypt',
    }).select().single()

    if (error) console.error(`Error creating club ${club.name}:`, error.message)
    else {
      createdClubs.push(data)
      console.log(`✓ Club created: ${club.name}`)
    }
  }

  // 3. Create sample events
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const events = [
    {
      title: 'District Installation Ceremony 26/27',
      slug: 'district-installation-2026',
      description: 'Join us for the official installation of the new district leadership team for RY 26/27.',
      start_at: nextWeek.toISOString(),
      end_at: new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      location: 'Cairo Marriott Hotel',
      capacity: 500,
      price: 0,
      category: 'Social',
      status: 'published',
      tags: ['installation', 'leadership', 'district'],
      registration_open: true,
    },
    {
      title: 'Professional Development Workshop: Leadership Skills',
      slug: 'leadership-workshop-2026',
      description: 'A comprehensive workshop on leadership skills for Rotaract club officers.',
      start_at: nextMonth.toISOString(),
      end_at: new Date(nextMonth.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      location: 'Egyptian Engineers Syndicate',
      capacity: 200,
      price: 50,
      currency: 'EGP',
      category: 'Professional',
      status: 'published',
      tags: ['workshop', 'leadership', 'professional'],
      registration_open: true,
    },
    {
      title: 'Community Service Day: Cleaning the Nile',
      slug: 'service-day-nile-2026',
      description: 'A district-wide service event to clean and preserve the Nile riverbanks.',
      start_at: new Date(nextMonth.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(nextMonth.getTime() + 14 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
      location: 'Nile River Bank, Cairo',
      capacity: 300,
      price: 0,
      category: 'Service',
      status: 'published',
      tags: ['service', 'environment', 'community'],
      registration_open: true,
    },
  ]

  for (const event of events) {
    const { error } = await supabase.from('events').insert({
      ...event,
      host_club_id: createdClubs[0]?.id,
      agenda: [
        { time: '09:00', title: 'Registration & Welcome', speaker: 'District Secretary' },
        { time: '10:00', title: 'Opening Ceremony', speaker: 'District Governor' },
        { time: '11:00', title: 'Main Session', speaker: 'Guest Speaker' },
      ],
    })
    if (error) console.error('Error creating event:', error.message)
    else console.log(`✓ Event created: ${event.title}`)
  }

  // 4. Create sample posts
  const posts = [
    { title: 'Welcome to RY 26/27', excerpt: 'A message from the District Governor about our vision for the upcoming year.', tags: ['district', 'welcome'], is_announcement: true, is_pinned: true, announcement_priority: 'important' },
    { title: 'Highlights from the District Assembly', excerpt: 'Key takeaways and photos from our successful District Assembly event.', tags: ['district', 'event'], is_announcement: false, is_pinned: false },
    { title: 'Membership Growth Tips for Clubs', excerpt: 'Practical strategies to grow your Rotaract club membership.', tags: ['membership', 'growth'], is_announcement: false, is_pinned: false },
    { title: 'Upcoming Training Opportunities', excerpt: 'Mark your calendars for these upcoming training sessions.', tags: ['training', 'opportunities'], is_announcement: true, announcement_priority: 'normal' },
  ]

  for (const post of posts) {
    const { error } = await supabase.from('posts').insert({
      ...post,
      slug: slugify(post.title, { lower: true, strict: true }),
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }] }] },
      status: 'published',
      published_at: new Date().toISOString(),
    })
    if (error) console.error('Error creating post:', error.message)
    else console.log(`✓ Post created: ${post.title}`)
  }

  // 5. Create history entries
  const historyEntries = [
    { year: 2005, title: 'District 2451 Founded', description: 'Rotaract District 2451 was established under Rotary International.', milestone_type: 'founding' },
    { year: 2010, title: 'First District Conference', description: 'The first-ever District 2451 conference was held in Cairo with 200 attendees.', milestone_type: 'event' },
    { year: 2015, title: '10th Anniversary Celebration', description: 'Celebrated a decade of service with clubs across Egypt.', milestone_type: 'achievement' },
    { year: 2018, title: 'Expansion to Upper Egypt', description: 'New clubs established in Luxor, Aswan, and Hurghada.', milestone_type: 'achievement' },
    { year: 2020, title: 'Digital Transformation', description: 'Successfully moved operations online during the global pandemic.', milestone_type: 'leadership' },
    { year: 2023, title: '50 Clubs Milestone', description: 'District 2451 reached 50 active Rotaract clubs.', milestone_type: 'achievement' },
  ]

  for (const entry of historyEntries) {
    const { error } = await supabase.from('history_entries').insert(entry)
    if (error) console.error('Error creating history entry:', error.message)
    else console.log(`✓ History entry: ${entry.title}`)
  }

  // 6. Create library categories and items
  const categories = [
    { name: 'Handbooks', slug: 'handbooks', description: 'Official Rotaract handbooks and guides', sort_order: 1 },
    { name: 'Templates', slug: 'templates', description: 'Club management templates', sort_order: 2 },
    { name: 'Training Materials', slug: 'training', description: 'Training resources for club officers', sort_order: 3 },
    { name: 'Forms', slug: 'forms', description: 'Official Rotaract forms', sort_order: 4 },
  ]

  for (const cat of categories) {
    const { data, error } = await supabase.from('library_categories').insert(cat).select().single()
    if (error) console.error('Error creating category:', error.message)
    else {
      // Create items for each category
      const items = [
        { title: `${cat.name} - Sample 1`, description: `Sample ${cat.name.toLowerCase()} resource`, type: 'document', category_id: data.id, is_published: true },
        { title: `${cat.name} - Sample 2`, description: `Another ${cat.name.toLowerCase()} resource`, type: 'pdf', category_id: data.id, is_published: true },
      ]
      for (const item of items) {
        await supabase.from('library_items').insert(item)
      }
      console.log(`✓ Category created: ${cat.name}`)
    }
  }

  // 7. Create district settings
  const settings = {
    district_info: {
      name: 'Rotaract District 2451',
      year: '26/27',
      governor: 'District Governor',
      theme: 'Empowering Young Leaders',
      logo_url: '',
    },
    hero_slides: [
      { image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1600', title: 'Welcome to Rotaract District 2451', subtitle: 'Empowering young leaders across Egypt' },
      { image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1600', title: 'Make a Difference', subtitle: 'Join our community service initiatives' },
      { image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600', title: 'Grow as a Leader', subtitle: 'Professional development opportunities await' },
    ],
    contact_info: {
      email: 'info@rotaractd2451.org',
      phone: '+20 100 000 0000',
      address: 'Cairo, Egypt',
    },
    feature_flags: {
      registration_open: true,
      guest_registration: true,
      show_member_directory: true,
      gallery_public: true,
      maintenance_mode: false,
    },
  }

  for (const [key, value] of Object.entries(settings)) {
    await supabase.from('site_settings').upsert({ key, value })
  }
  console.log('✓ Site settings configured')

  console.log('\n✅ Seed complete!')
}

seed().catch(console.error)
