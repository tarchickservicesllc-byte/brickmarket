import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1d4ed8',
          borderRadius: 96,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 280,
            fontWeight: 900,
            fontFamily: 'Arial',
            lineHeight: 1,
          }}
        >
          B
        </span>
      </div>
    ),
    { ...size }
  )
}
