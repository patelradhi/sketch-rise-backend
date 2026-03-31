import mongoose, { Schema, type Document } from 'mongoose'

export interface IProject extends Document {
  userId: string
  title: string
  originalSketchBase64?: string
  originalSketchUrl?: string
  renderData: Record<string, unknown>
  thumbnailBase64?: string
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
    originalSketchBase64: { type: String },
    originalSketchUrl: { type: String },
    renderData: { type: Schema.Types.Mixed, required: true },
    thumbnailBase64: { type: String },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
)

// Prevent returning huge base64 fields in list queries
ProjectSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model<IProject>('Project', ProjectSchema)
