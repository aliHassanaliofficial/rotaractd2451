import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/constants'

export const alt = `${SITE_NAME} — Empowering Young Leaders in Egypt`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #003865 0%, #0a4a82 55%, #A01446 130%)',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: '#F7A81B',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            right: -160,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background: 'rgba(247, 168, 27, 0.18)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -140,
            left: -140,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: 'rgba(217, 27, 92, 0.22)',
            display: 'flex',
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          Rotaract D2451
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 36,
            color: '#F7A81B',
            fontWeight: 500,
          }}
        >
          Empowering Young Leaders in Egypt
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 56,
            fontSize: 26,
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: '0.08em',
          }}
        >
          rotaract2451.org
        </div>
      </div>
    ),
    { ...size }
  )
}
