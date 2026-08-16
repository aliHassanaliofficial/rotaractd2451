'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Mail, Loader2, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function VerifyPage() {
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = useCallback(async () => {
    const res = await fetch('/api/auth/resend', { method: 'POST' })

    if (res.status === 429) {
      toast.error('Too many requests. Please wait before resending.')
      setCooldown(120)
      return
    }

    const result = await res.json()

    if (!res.ok) {
      toast.error(result.error || 'Failed to resend verification email')
      return
    }

    toast.success('Verification email sent!')
    setCooldown(60)
  }, [])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-gold/30 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
              <Mail className="h-8 w-8 text-gold" />
            </div>
            <CardTitle className="text-2xl font-bold text-navy">
              Check Your Email
            </CardTitle>
            <CardDescription>
              We&apos;ve sent a verification link to your email address.
              Please click the link to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="rounded-2xl bg-amber-50 p-4 text-left text-sm text-amber-800">
              <p className="font-medium">Almost there!</p>
              <p className="mt-1 text-amber-700">
                After you verify your email, your club admin and the district team will review
                your registration and activate your membership. This usually takes a few days.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 text-left text-sm text-blue-800">
              <p className="font-medium">Didn&apos;t receive the email?</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-blue-700">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email</li>
                <li>It may take a few minutes to arrive</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resend in {cooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <div className="space-y-2">
              <Button variant="link" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Go to Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
