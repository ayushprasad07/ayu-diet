import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import dbConnect from "@/lib/dbConnect";
import { Doctor } from "@/model/doctorSchema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, specialization } = body;

    // Validate required fields
    if (!name || !email || !password || !specialization) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new doctor
    const doctor = await Doctor.create({
      name,
      email,
      password: hashedPassword,
      specialization,
      patients: []
    });

    // Remove password from response
    const { password: _, ...doctorData } = doctor.toObject();

    return NextResponse.json(
      { message: "Doctor registered successfully", data: doctorData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during doctor registration:", error);
    return NextResponse.json(
      { error: "Failed to register doctor" },
      { status: 500 }
    );
  }
}