import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Link-preview card (WhatsApp, X, Slack…): the landing page's thesis in one frame.
export const alt = 'HabitTerminal — Every day gets a score. Secure yours.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GREEN = '#6cdd81';
const INK = '#dfe2eb';
const MUTED = '#889486';

// Brand faces, read at build time (the image is statically generated).
const font = (pkg: string, file: string) =>
  readFile(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', file));

export default async function OpengraphImage() {
  const [grotesk700, grotesk500, mono700, mono500] = await Promise.all([
    font('space-grotesk', 'space-grotesk-latin-700-normal.woff'),
    font('space-grotesk', 'space-grotesk-latin-500-normal.woff'),
    font('jetbrains-mono', 'jetbrains-mono-latin-700-normal.woff'),
    font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff'),
  ]);
  const meters: [string, number, number][] = [
    ['Focus', 2, 2],
    ['Five prayers', 2, 2],
    ['Self-control', 2, 2],
    ['Quran + dhikr', 1, 1],
    ['Night prayer', 1, 1],
    ['Sleep', 1, 1],
    ['Tasks', 1, 1],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#10141a',
          padding: '64px 72px',
          fontFamily: 'Grotesk',
        }}
      >
        {/* Left: brand + headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 46,
                border: `4px solid ${GREEN}`,
                borderRadius: 10,
                color: GREEN,
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'Mono',
              }}
            >
              {'>_'}
            </div>
            <div style={{ color: GREEN, fontSize: 34, fontWeight: 700, fontFamily: 'Mono', letterSpacing: -1 }}>HabitTerminal</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: INK, fontSize: 82, fontWeight: 700, lineHeight: 0.95, letterSpacing: -3.5 }}>
              Every day gets a score.
            </div>
            <div style={{ color: GREEN, fontSize: 82, fontWeight: 700, lineHeight: 1.05, letterSpacing: -3.5 }}>
              Secure yours.
            </div>
          </div>

          <div style={{ display: 'flex', color: MUTED, fontSize: 19, fontFamily: 'Mono', fontWeight: 500 }}>
            focus · five prayers · quran · self-control · sleep · tasks
          </div>
        </div>

        {/* Right: a secured day */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 340,
            marginLeft: 48,
            padding: '30px 30px 26px',
            background: '#15191f',
            border: '2px solid #2a3330',
            borderRadius: 8,
          }}
        >
          <div style={{ color: MUTED, fontSize: 16, letterSpacing: 4, fontFamily: 'Mono', fontWeight: 500 }}>DAY SCORE</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 18 }}>
            <div style={{ color: GREEN, fontSize: 132, fontWeight: 700, fontFamily: 'Mono', lineHeight: 0.8, letterSpacing: -8 }}>10</div>
            <div style={{ color: MUTED, fontSize: 32, fontFamily: 'Mono', marginLeft: 10, marginBottom: 2 }}>/10</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22, color: GREEN, fontSize: 16, letterSpacing: 3, fontFamily: 'Mono', fontWeight: 500 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: GREEN }} />
            DAY SECURED
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 22 }}>
            {meters.map(([label, earned, max]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: INK, fontSize: 18, fontWeight: 500 }}>{label}</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {Array.from({ length: max }).map((_, i) => (
                    <div key={i} style={{ width: 30, height: 9, background: i < earned ? GREEN : '#31353c' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Grotesk', data: grotesk700, weight: 700, style: 'normal' },
        { name: 'Grotesk', data: grotesk500, weight: 500, style: 'normal' },
        { name: 'Mono', data: mono700, weight: 700, style: 'normal' },
        { name: 'Mono', data: mono500, weight: 500, style: 'normal' },
      ],
    }
  );
}
