import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

type Folder = '2d' | '3d'

export async function uploadImage(
  base64: string,
  mimeType: string,
  folder: Folder,
  userId: string,
): Promise<string> {
  const dataUrl = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `sketchrise/${folder}/${userId}`,
    resource_type: 'image',
  })
  return result.secure_url
}
