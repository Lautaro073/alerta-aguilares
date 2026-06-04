import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Firebase Config
  FIREBASE_PROJECT_ID: z.string().min(1).default('ciudadalerta-dev'),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional().or(z.literal('')),
  FIREBASE_PRIVATE_KEY: z.string().min(1).optional().or(z.literal('')),
  
  // Hashing Salt para rate limiting anonimizado
  HASH_SALT: z.string().min(32).default('a_very_long_and_secure_random_salt_placeholder_for_development'),
  
  // Google Maps (opcional para Street View)
  GOOGLE_MAPS_API_KEY: z.string().optional().or(z.literal('')),

  // FCM VAPID Key (opcional para desarrollo, recomendado para producción)
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional().or(z.literal('')),

  // Firebase App Check — reCAPTCHA v3 Site Key
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional().or(z.literal('')),

  // Cloudinary (almacenamiento de fotos de reportes)
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  
  // Rate Limiting Config
  MAX_REPORTS_PER_DAY_FP: z.coerce.number().default(5),
  MAX_REPORTS_PER_DAY_IP: z.coerce.number().default(10),
  RATE_LIMIT_WINDOW_HOURS: z.coerce.number().default(24),
  
  // CORS / API Protection
  ALLOWED_ORIGIN: z.string().min(1).default('http://localhost:3000'),
});

// Validación en cascada: En producción, requerir credenciales reales de forma estricta.
const extendedEnvSchema = EnvSchema.superRefine((data, ctx) => {
  // En Next.js, durante el comando `next build`, las rutas se evalúan para determinar si son dinámicas o estáticas.
  // Evitamos lanzar errores de validación de producción durante la fase de compilación local (build phase).
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  if (data.NODE_ENV === 'production' && !isBuildPhase) {
    if (!data.FIREBASE_CLIENT_EMAIL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FIREBASE_CLIENT_EMAIL'],
        message: 'El correo del cliente de Firebase Admin SDK (FIREBASE_CLIENT_EMAIL) es obligatorio en producción.',
      });
    }
    if (!data.FIREBASE_PRIVATE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FIREBASE_PRIVATE_KEY'],
        message: 'La clave privada de Firebase Admin SDK (FIREBASE_PRIVATE_KEY) es obligatoria en producción.',
      });
    }
    if (data.HASH_SALT === 'a_very_long_and_secure_random_salt_placeholder_for_development') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['HASH_SALT'],
        message: 'Se debe proporcionar una firma aleatoria segura (HASH_SALT) de al menos 32 caracteres en producción.',
      });
    }
    if (!data.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['NEXT_PUBLIC_RECAPTCHA_SITE_KEY'],
        message: 'NEXT_PUBLIC_RECAPTCHA_SITE_KEY es obligatoria en produccion para Firebase App Check.',
      });
    }
  }
});

export const env = extendedEnvSchema.parse(process.env);
