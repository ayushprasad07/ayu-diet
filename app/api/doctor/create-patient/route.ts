import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/model/userSchema';
import { Doctor } from '@/model/doctorSchema';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      age,
      gender,
      doshaType,
      avoidIngredients = []
    } = body;

    // Validate required fields
    if (!name || !email || !password || !age || !gender || !doshaType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new patient
    const patient = await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      gender,
      doshaType,
      avoidIngredients,
      createdBy: session.user.id
    });

    // Update doctor's patients list
    await Doctor.findByIdAndUpdate(
      session.user.id,
      { $push: { patients: patient._id } }
    );

    // Don't send password in response
    const { password: _, ...patientData } = patient.toObject();

    return NextResponse.json(patientData, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}