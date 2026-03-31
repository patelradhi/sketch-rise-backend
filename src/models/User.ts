import mongoose, { Schema, type Document } from 'mongoose'

export interface IUser extends Document {
  clerkId: string
  email: string
  username?: string
  plan: 'free' | 'pro'
  generationsUsed: number
  generationsLimit: number
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    username: { type: String },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    generationsUsed: { type: Number, default: 0 },
    generationsLimit: { type: Number, default: 10 },
  },
  { timestamps: true },
)

export default mongoose.model<IUser>('User', UserSchema)
