import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Doctor extends Document {
  name: string;
  email: string;
  password: string;
  specialization: string;
  patients: Types.ObjectId[];
}

const doctorSchema = new Schema<Doctor>({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  specialization: { 
    type: String, 
    required: true 
  },
  patients: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, {
  timestamps: true
});

// Don't recreate the model if it exists
export const Doctor = mongoose.models.Doctor || mongoose.model<Doctor>('Doctor', doctorSchema);