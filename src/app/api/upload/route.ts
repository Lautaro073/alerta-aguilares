import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/server/cloudinary';
import { badRequest, serverError } from '@/lib/server/response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return badRequest('No se proporcionó ningún archivo.');
    }

    // Validar tipo de archivo (solo fotos reales, excluyendo explícitamente SVG u otros formatos vectoriales)
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return badRequest('El formato de archivo no es válido. Solo se permiten fotos reales (JPEG, PNG, WEBP, HEIC).');
    }

    // Validar tamaño máximo (p. ej. 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return badRequest('La imagen es demasiado grande. El límite es de 10 MB.');
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    interface CloudinaryUploadResult {
      secure_url: string;
      public_id: string;
    }

    // Subir a Cloudinary utilizando un upload_stream
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'alertaaguilares',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result as unknown as CloudinaryUploadResult);
          } else {
            reject(new Error('Resultado de Cloudinary vacío'));
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    return serverError('POST_UPLOAD_ROUTE', error);
  }
}
