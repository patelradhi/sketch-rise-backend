import mongoose, { Schema, type Document } from 'mongoose'

export interface IProject extends Document {
  userId: string
  title: string
  originalSketchUrl?: string  // 2D sketch on Cloudinary (sketchrise/2d/{userId}/...)
  renderedImageUrl?: string   // 3D render on Cloudinary (sketchrise/3d/{userId}/...)
  isPublic: boolean
  shareToken?: string
  version: number
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'Untitled Project' },
    originalSketchUrl: { type: String },
    renderedImageUrl: { type: String },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
)

// Prevent returning huge base64 fields in list queries
ProjectSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model<IProject>('Project', ProjectSchema)
