import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/**
 * Tarjeta social generada en tiempo de build.
 *
 * Compone la ilustración de `public/og.png` (sin texto, con el tercio izquierdo
 * despejado a propósito) con el título tipografiado por código. Se hace así
 * porque los generadores de imágenes escriben mal el texto: acá sale nítido, con
 * las tipografías reales del sitio y los acentos correctos.
 *
 * Al ser un archivo de convención, Next.js lo aplica a esta ruta y hereda a las
 * anidadas, así que cubre `/`, `/privacidad` y `/terminos` con una sola imagen.
 */

export const alt = 'Alertas Aguilares — Reportá los problemas de tu barrio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Las lecturas arrancan a nivel de módulo para que las dos tipografías se lean
// una sola vez, no en cada invocación. Deben ser TrueType u OpenType: Satori no
// lee WOFF2 ni EOT (Google Fonts devuelve uno u otro según el User-Agent).
const outfitExtraBold = readFile(join(process.cwd(), 'src/app/Outfit-ExtraBold.ttf'));
const jakartaMedium = readFile(join(process.cwd(), 'src/app/PlusJakartaSans-Medium.ttf'));

export default async function OpengraphImage() {
  const [outfit, jakarta, background] = await Promise.all([
    outfitExtraBold,
    jakartaMedium,
    readFile(join(process.cwd(), 'public/og.png')),
  ]);

  const backgroundSrc = `data:image/png;base64,${background.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#080d1a',
        }}
      >
        {/* Ilustración de fondo, recortada al encuadre de la tarjeta.
            Satori solo entiende <img>: next/image no funciona dentro de
            ImageResponse. El alt va vacío porque la imagen es decorativa y el
            texto alternativo de la tarjeta lo aporta el export `alt`. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={backgroundSrc}
          width={size.width}
          height={size.height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Velo hacia la izquierda: asegura contraste del texto por más que
            cambie la ilustración de fondo. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            backgroundImage:
              'linear-gradient(90deg, rgba(8,13,26,0.97) 0%, rgba(8,13,26,0.92) 30%, rgba(8,13,26,0.55) 52%, rgba(8,13,26,0) 70%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '66%',
            height: '100%',
            padding: '0 84px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: 'Jakarta',
              fontSize: 24,
              letterSpacing: '0.18em',
              color: '#4f7cff',
            }}
          >
            AGUILARES · TUCUMÁN
          </div>

          <div
            style={{
              display: 'flex',
              fontFamily: 'Outfit',
              fontSize: 82,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              marginTop: 22,
            }}
          >
            Alertas Aguilares
          </div>

          <div
            style={{
              display: 'flex',
              fontFamily: 'Jakarta',
              fontSize: 32,
              lineHeight: 1.3,
              color: '#94a3b8',
              marginTop: 26,
            }}
          >
            Reportá los problemas de tu barrio
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Outfit', data: outfit, style: 'normal', weight: 800 },
        { name: 'Jakarta', data: jakarta, style: 'normal', weight: 500 },
      ],
    }
  );
}
