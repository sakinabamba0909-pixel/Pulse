import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: '#1A1A1A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: '#2DB87A',
        }} />
      </div>
    ),
    { ...size }
  )
}
