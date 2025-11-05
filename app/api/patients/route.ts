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
      .populate({ path: 'patients', select: 'name email doshaType dietPlan' })
      .lean() as any;

    const patients = (doctor?.patients || []).map((p: any) => ({
      id: String(p._id),
      name: p.name,
      email: p.email,
      doshaType: p.doshaType,
      dietPlan: p.dietPlan,
    }));

    return NextResponse.json(patients, { status: 200 });
  } catch (e) {
    console.error('Error fetching patients:', e);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}


