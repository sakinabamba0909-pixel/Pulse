import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        width: 180, height: 180, borderRadius: 40,
        background: '#1A1A1A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#2DB87A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#1A1A1A',
          }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
