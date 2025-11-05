import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/model/userSchema";
import { Doctor } from "@/model/doctorSchema";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, 
      email, 
      password, 
      age, 
      gender, 
      doshaType, 
      avoidIngredients = [],
      doctorId  // Optional: only if patient is created by logged-in doctor
    } = body;

    // Validate required fields
    if (!name || !email || !password || !age || !gender || !doshaType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if patient already exists
    const existingPatient = await User.findOne({ email });
    if (existingPatient) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    let createdByDoctorId = doctorId;

    // If no doctorId provided, check if request is from logged-in doctor
    if (!createdByDoctorId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.role === 'doctor') {
        createdByDoctorId = session.user.id;
      }
    }

    // Verify doctor exists
    if (createdByDoctorId) {
      const doctor = await Doctor.findById(createdByDoctorId);
      if (!doctor) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 }
        );
      }
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
      createdBy: createdByDoctorId
    });

    // If created by doctor, add patient to doctor's patients list
    if (createdByDoctorId) {
      await Doctor.findByIdAndUpdate(
        createdByDoctorId,
        { $push: { patients: patient._id } }
      );
    }

    // Remove password from response
    const { password: _, ...patientData } = patient.toObject();

    return NextResponse.json(
      { message: "Patient registered successfully", data: patientData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during patient registration:", error);
    return NextResponse.json(
      { error: "Failed to register patient" },
      { status: 500 }
    );
  }
}