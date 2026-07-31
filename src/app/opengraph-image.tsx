import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Fee Calculator by Enzyme APD';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#020617', // slate-950
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* We can just use text and some styling since we don't have a reliable URL to the local icon at edge runtime without reading it from fs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: '24px',
            width: '160px',
            height: '160px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: '120px', fontWeight: 'bold', color: '#020617', display: 'flex', alignItems: 'center' }}>
            e<span style={{ color: '#22c55e' }}>.</span>
          </div>
        </div>
        
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bolder',
            color: 'white',
            marginTop: '48px',
            letterSpacing: '-2px',
          }}
        >
          Fee Calculator
        </div>
        
        <div
          style={{
            fontSize: '32px',
            color: '#94a3b8',
            marginTop: '16px',
            fontWeight: '500',
          }}
        >
          By Enzyme APD
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
