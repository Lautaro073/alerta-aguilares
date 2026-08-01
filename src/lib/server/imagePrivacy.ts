import sharp from 'sharp';
import { env } from './env';

const NVIDIA_NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_NIM_MODEL = 'nvidia/nemotron-3.5-content-safety';

const MUNICIPAL_IMAGE_POLICY = `
Evaluate only the attached image for publication in a municipal incident report.

Disallowed content:
- readable identity documents, medical records, phone numbers or other private personal data
- readable vehicle license plates
- explicit nudity or sexual content
- graphic exposed injuries, corpses or gore

Allowed content:
- streets, buildings, vehicles, infrastructure failures and property damage
- non-graphic accidents or emergencies
- people or faces, because faces are blurred separately before publication
`;

export async function hasSensitiveImageContent(buffer: Buffer): Promise<boolean> {
  if (!env.NVIDIA_NIM_API_KEY) return false;

  try {
    const jpeg = await sharp(buffer)
      .rotate()
      .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const response = await fetch(NVIDIA_NIM_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.NVIDIA_NIM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_NIM_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Classify this municipal report image using the custom policy.' },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${jpeg.toString('base64')}` },
            },
          ],
        }],
        max_tokens: 100,
        temperature: 0.01,
        top_p: 0.95,
        chat_template_kwargs: {
          custom_policy: MUNICIPAL_IMAGE_POLICY,
          request_categories: '/categories',
          enable_thinking: false,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.warn(`[NVIDIA_NIM] Image safety check failed with status ${response.status}.`);
      return false;
    }

    const result = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return /User Safety:\s*unsafe/i.test(result.choices?.[0]?.message?.content ?? '');
  } catch (error) {
    console.warn('[NVIDIA_NIM] Image safety check unavailable; face blurring remains active.', error);
    return false;
  }
}
