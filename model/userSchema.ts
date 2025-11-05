import mongoose, { Schema, Document, Types } from 'mongoose';

export interface User extends Document {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  doshaType: 'vata' | 'pitta' | 'kapha';
  avoidIngredients: string[];
  dietPlan: any; // Will be populated by the diet generation API
  createdBy?: Types.ObjectId;
}

const userSchema = new Schema<User>({
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
  age: { 
    type: Number, 
    required: true 
  },
  gender: { 
    type: String, 
    required: true,
    enum: ['male', 'female', 'other']
  },
  doshaType: { 
    type: String, 
    required: true,
    enum: ['vata', 'pitta', 'kapha']
  },
  avoidIngredients: [{ 
    type: String 
  }],
  dietPlan: { 
    type: Schema.Types.Mixed 
  },
  createdBy: { 
  	type: Schema.Types.ObjectId, 
  	ref: 'Doctor',
  	required: false
  }
}, {
  timestamps: true
});

// Don't recreate the model if it exists
export const User = mongoose.models.User || mongoose.model<User>('User', userSchema);