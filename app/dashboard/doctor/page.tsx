'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Patient {
  id: string;
  name: string;
  email: string;
  doshaType?: string;
  dietPlan?: any;
}

interface Diet {
  id: string;
  patientName: string;
  patientEmail: string;
  createdAt: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  healthCondition?: string;
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<Patient | null>(null);
  const [isCreatingDiet, setIsCreatingDiet] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [dietMode, setDietMode] = useState<'manual' | 'generate'>('manual');
  const [patientFormData, setPatientFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    doshaType: '',
    avoidIngredients: '',
  });
  const [formData, setFormData] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    healthCondition: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'doctor') {
      router.push('/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchPatients();
    fetchDiets();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchDiets = async () => {
    try {
      const response = await fetch('/api/diets');
      const data = await response.json();
      setDiets(data);
    } catch (error) {
      console.error('Failed to fetch diets:', error);
    }
  };

  const fetchPatientDetails = async (email: string) => {
    try {
      const response = await fetch(`/api/doctor/patient-details?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPatientDetails(data);
        setShowPatientDetails(true);
      }
    } catch (error) {
      console.error('Failed to fetch patient details:', error);
      toast.error('Failed to load patient details');
    }
  };

  const formatDietPlan = (dietPlan: any) => {
    if (!dietPlan || dietPlan.type === 'manual') {
      return null;
    }

    const { dosha, plan, avoidIngredients, createdAt } = dietPlan;
    let formatted = '';

    formatted += `📋 Diet Plan Details\n`;
    formatted += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    formatted += `Dosha Type: ${dosha || dietPlan.doshaType || 'N/A'}\n`;
    if (avoidIngredients && avoidIngredients.length > 0) {
      formatted += `Ingredients to Avoid: ${avoidIngredients.join(', ')}\n`;
    }
    formatted += `Created: ${new Date(createdAt).toLocaleDateString()}\n\n`;

    if (plan && typeof plan === 'object') {
      const days = Object.keys(plan).sort();
      
      days.forEach((day) => {
        const meals = plan[day];
        if (Array.isArray(meals) && meals.length > 0) {
          formatted += `🍽️  ${day}\n`;
          formatted += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          
          meals.forEach((meal: any, index: number) => {
            formatted += `${index + 1}. ${meal.title || 'Meal'}\n`;
            
            if (meal.ingredients) {
              try {
                const ingredients = typeof meal.ingredients === 'string' 
                  ? JSON.parse(meal.ingredients) 
                  : meal.ingredients;
                if (Array.isArray(ingredients)) {
                  formatted += `   Ingredients: ${ingredients.join(', ')}\n`;
                }
              } catch {
                formatted += `   Ingredients: ${meal.ingredients}\n`;
              }
            }
            
            formatted += `   📊 Nutrition:\n`;
            if (meal.calories) formatted += `      • Calories: ${meal.calories} kcal\n`;
            if (meal.protein) formatted += `      • Protein: ${meal.protein}g\n`;
            if (meal.carbs) formatted += `      • Carbs: ${meal.carbs}g\n`;
            if (meal.fat) formatted += `      • Fat: ${meal.fat}g\n`;
            if (meal.health_score) formatted += `      • Health Score: ${(meal.health_score * 100).toFixed(1)}%\n`;
            
            formatted += `\n`;
          });
          formatted += `\n`;
        }
      });
    }

    return formatted;
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPatient(true);

    try {
      const avoidIngredientsArray = patientFormData.avoidIngredients
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const response = await fetch('/api/doctor/create-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...patientFormData,
          age: Number(patientFormData.age),
          avoidIngredients: avoidIngredientsArray,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create patient');
      }

      toast.success('Patient created successfully');
      fetchPatients();
      
      // Reset form
      setPatientFormData({
        name: '',
        email: '',
        password: '',
        age: '',
        gender: '',
        doshaType: '',
        avoidIngredients: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create patient');
    } finally {
      setIsCreatingPatient(false);
    }
  };

  const handleCreateDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    setIsCreatingDiet(true);

    try {
      const payload: any = { patientEmail: selectedPatient };
      
      if (dietMode === 'manual') {
        if (!formData.calories || !formData.protein || !formData.carbs || !formData.fat) {
          toast.error('Please fill in all nutrition values');
          setIsCreatingDiet(false);
          return;
        }
        payload.calories = formData.calories;
        payload.protein = formData.protein;
        payload.carbs = formData.carbs;
        payload.fat = formData.fat;
        payload.healthCondition = formData.healthCondition;
      }

      const response = await fetch('/api/create-diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create diet plan');
      }

      const result = await response.json();
      toast.success('Diet plan created successfully');
      
      // Refresh diets and patients
      fetchDiets();
      fetchPatients();

      // Reset form
      setSelectedPatient('');
      setFormData({
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        healthCondition: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create diet plan');
    } finally {
      setIsCreatingDiet(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Subtle background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl p-6 mb-8 transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, Dr. {session?.user?.name}
              </h1>
              <p className="text-gray-600 mt-1">Manage your patients and diet plans</p>
            </div>
            <Button 
              onClick={() => router.push('/api/auth/signout')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="backdrop-blur-md bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-200/50 rounded-xl p-4 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Patients</p>
                  <p className="text-3xl font-bold text-indigo-600">{patients.length}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-200/50 rounded-xl p-4 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Diet Plans</p>
                  <p className="text-3xl font-bold text-purple-600">{diets.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-200/50 rounded-xl p-4 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Plans</p>
                  <p className="text-3xl font-bold text-green-600">{patients.filter(p => p.dietPlan).length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patients Card */}
          <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
            <div className="p-6 border-b border-white/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Your Patients</h2>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Patient
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95 border border-white/50">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Create New Patient
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePatient} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="patient-name" className="text-gray-700 font-medium">Full Name</Label>
                        <Input
                          id="patient-name"
                          value={patientFormData.name}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, name: e.target.value })
                          }
                          className="mt-1 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient-email" className="text-gray-700 font-medium">Email</Label>
                        <Input
                          id="patient-email"
                          type="email"
                          value={patientFormData.email}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, email: e.target.value })
                          }
                          className="mt-1 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient-password" className="text-gray-700 font-medium">Password</Label>
                        <Input
                          id="patient-password"
                          type="password"
                          value={patientFormData.password}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, password: e.target.value })
                          }
                          className="mt-1 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="patient-age" className="text-gray-700 font-medium">Age</Label>
                          <Input
                            id="patient-age"
                            type="number"
                            value={patientFormData.age}
                            onChange={(e) =>
                              setPatientFormData({ ...patientFormData, age: e.target.value })
                            }
                            className="mt-1 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="patient-gender" className="text-gray-700 font-medium">Gender</Label>
                          <Select
                            value={patientFormData.gender}
                            onValueChange={(value) =>
                              setPatientFormData({ ...patientFormData, gender: value })
                            }
                          >
                            <SelectTrigger className="mt-1 bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="patient-dosha" className="text-gray-700 font-medium">Dosha Type</Label>
                        <Select
                          value={patientFormData.doshaType}
                          onValueChange={(value) =>
                            setPatientFormData({ ...patientFormData, doshaType: value })
                          }
                        >
                          <SelectTrigger className="mt-1 bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Select dosha type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vata">Vata</SelectItem>
                            <SelectItem value="pitta">Pitta</SelectItem>
                            <SelectItem value="kapha">Kapha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="patient-avoid" className="text-gray-700 font-medium">Ingredients to Avoid (comma separated)</Label>
                        <Input
                          id="patient-avoid"
                          value={patientFormData.avoidIngredients}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, avoidIngredients: e.target.value })
                          }
                          className="mt-1 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g., nuts, dairy, gluten"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isCreatingPatient}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isCreatingPatient ? 'Creating...' : 'Create Patient'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="p-6 max-h-[600px] overflow-y-auto">
              {patients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No patients yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first patient to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="backdrop-blur-md bg-gradient-to-r from-white/60 to-white/40 border border-white/50 rounded-xl p-4 hover:shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] group"
                      onClick={() => fetchPatientDetails(patient.email)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{patient.name}</p>
                            <p className="text-sm text-gray-600">{patient.email}</p>
                            {patient.doshaType && (
                              <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                {patient.doshaType}
                              </span>
                            )}
                          </div>
                        </div>
                        {patient.dietPlan && (
                          <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-medium">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Diet Plans Card */}
          <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
            <div className="p-6 border-b border-white/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Diet Plans</h2>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95 border border-white/50">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Create New Diet Plan
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateDiet} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="patient" className="text-gray-700 font-medium">Patient</Label>
                        <Select
                          value={selectedPatient}
                          onValueChange={setSelectedPatient}
                        >
                          <SelectTrigger className="mt-1 bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.email}>
                                {patient.name} ({patient.doshaType || 'N/A'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="diet-mode" className="text-gray-700 font-medium">Diet Creation Mode</Label>
                        <Select
                          value={dietMode}
                          onValueChange={(value: 'manual' | 'generate') => setDietMode(value)}
                        >
                          <SelectTrigger className="mt-1 bg-gray-50 border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual Entry</SelectItem>
                            <SelectItem value="generate">Generate from Dosha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {dietMode === 'manual' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="calories" className="text-gray-700 font-medium">Calories</Label>
                              <Input
                                id="calories"
                                type="number"
                                value={formData.calories}
                                onChange={(e) =>
                                  setFormData({ ...formData, calories: e.target.value })
                                }
                                className="mt-1 bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="protein" className="text-gray-700 font-medium">Protein (g)</Label>
                              <Input
                                id="protein"
                                type="number"
                                value={formData.protein}
                                onChange={(e) =>
                                  setFormData({ ...formData, protein: e.target.value })
                                }
                                className="mt-1 bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="carbs" className="text-gray-700 font-medium">Carbs (g)</Label>
                              <Input
                                id="carbs"
                                type="number"
                                value={formData.carbs}
                                onChange={(e) =>
                                  setFormData({ ...formData, carbs: e.target.value })
                                }
                                className="mt-1 bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="fat" className="text-gray-700 font-medium">Fat (g)</Label>
                              <Input
                                id="fat"
                                type="number"
                                value={formData.fat}
                                onChange={(e) =>
                                  setFormData({ ...formData, fat: e.target.value })
                                }
                                className="mt-1 bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="healthCondition" className="text-gray-700 font-medium">Health Condition</Label>
                            <Input
                              id="healthCondition"
                              value={formData.healthCondition}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  healthCondition: e.target.value,
                                })
                              }
                              className="mt-1 bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                            />
                          </div>
                        </>
                      )}

                      {dietMode === 'generate' && (
                        <div className="backdrop-blur-md bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl">
                          <div className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-blue-800">
                              Diet will be automatically generated based on the patient's Dosha type and avoid ingredients.
                            </p>
                          </div>
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        disabled={isCreatingDiet}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isCreatingDiet ? 'Creating...' : 'Create Diet Plan'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="p-6 max-h-[600px] overflow-y-auto">
              {diets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No diet plans yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create a diet plan for your patients</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {diets.map((diet) => (
                    <div
                      key={diet.id}
                      className="backdrop-blur-md bg-gradient-to-r from-white/60 to-white/40 border border-white/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg mt-1">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{diet.patientName}</p>
                            <p className="text-sm text-gray-600">
                              Created: {new Date(diet.createdAt).toLocaleDateString()}
                            </p>
                            {diet.calories && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                  {diet.calories} cal
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {diet.protein}g protein
                                </span>
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                  {diet.carbs}g carbs
                                </span>
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                  {diet.fat}g fat
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Details Dialog */}
      {showPatientDetails && selectedPatientDetails && (
        <Dialog open={showPatientDetails} onOpenChange={setShowPatientDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95 border border-white/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Patient Details - {selectedPatientDetails.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="backdrop-blur-md bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-800">{selectedPatientDetails.email}</p>
                </div>
                <div className="backdrop-blur-md bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Dosha Type</p>
                  <p className="font-semibold text-gray-800">{selectedPatientDetails.doshaType || 'N/A'}</p>
                </div>
              </div>

              {selectedPatientDetails.dietPlan && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Current Diet Plan
                  </h3>
                  <div className="backdrop-blur-md bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto">
                    {selectedPatientDetails.dietPlan.type === 'manual' ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">Manual Entry</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-xs text-gray-600">Calories</p>
                            <p className="text-xl font-bold text-orange-600">{selectedPatientDetails.dietPlan.calories}</p>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-gray-600">Protein</p>
                            <p className="text-xl font-bold text-blue-600">{selectedPatientDetails.dietPlan.protein}g</p>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-gray-600">Carbs</p>
                            <p className="text-xl font-bold text-yellow-600">{selectedPatientDetails.dietPlan.carbs}g</p>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs text-gray-600">Fat</p>
                            <p className="text-xl font-bold text-red-600">{selectedPatientDetails.dietPlan.fat}g</p>
                          </div>
                        </div>
                        {selectedPatientDetails.dietPlan.healthCondition && (
                          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-xs text-gray-600">Health Condition</p>
                            <p className="font-medium text-gray-800">{selectedPatientDetails.dietPlan.healthCondition}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                        {formatDietPlan(selectedPatientDetails.dietPlan) || 'Unable to format diet plan'}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!selectedPatientDetails.dietPlan && (
                <div className="text-center py-8">
                  <div className="inline-block p-4 bg-gray-100 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No diet plan created yet</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
