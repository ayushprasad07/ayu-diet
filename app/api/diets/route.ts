import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { Doctor } from '@/model/doctorSchema';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const doctor = await Doctor.findById(session.user.id)
      .populate({
        path: 'patients',
        select: 'name email dietPlan createdAt',
        match: { dietPlan: { $exists: true, $ne: null } }
      })
      .lean() as any;

    const diets = (doctor?.patients || [])
      .filter((p: any) => p.dietPlan)
      .map((patient: any) => ({
        id: patient._id.toString(),
        patientName: patient.name,
        patientEmail: patient.email,
        ...patient.dietPlan,
        createdAt: patient.dietPlan.createdAt || patient.createdAt
      }));

    return NextResponse.json(diets, { status: 200 });
  } catch (error) {
    console.error('Error fetching diets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diets' },
      { status: 500 }
    );
  }
}


