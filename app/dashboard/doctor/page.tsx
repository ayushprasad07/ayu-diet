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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Welcome, Dr. {session?.user?.name}
        </h1>
        <Button onClick={() => router.push('/api/auth/signout')}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Patients</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Patient</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Patient</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreatePatient} className="space-y-4">
                    <div>
                      <Label htmlFor="patient-name">Full Name</Label>
                      <Input
                        id="patient-name"
                        value={patientFormData.name}
                        onChange={(e) =>
                          setPatientFormData({ ...patientFormData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="patient-email">Email</Label>
                      <Input
                        id="patient-email"
                        type="email"
                        value={patientFormData.email}
                        onChange={(e) =>
                          setPatientFormData({ ...patientFormData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="patient-password">Password</Label>
                      <Input
                        id="patient-password"
                        type="password"
                        value={patientFormData.password}
                        onChange={(e) =>
                          setPatientFormData({ ...patientFormData, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patient-age">Age</Label>
                        <Input
                          id="patient-age"
                          type="number"
                          value={patientFormData.age}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, age: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient-gender">Gender</Label>
                        <Select
                          value={patientFormData.gender}
                          onValueChange={(value) =>
                            setPatientFormData({ ...patientFormData, gender: value })
                          }
                        >
                          <SelectTrigger>
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
                      <Label htmlFor="patient-dosha">Dosha Type</Label>
                      <Select
                        value={patientFormData.doshaType}
                        onValueChange={(value) =>
                          setPatientFormData({ ...patientFormData, doshaType: value })
                        }
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="patient-avoid">Ingredients to Avoid (comma separated)</Label>
                      <Input
                        id="patient-avoid"
                        value={patientFormData.avoidIngredients}
                        onChange={(e) =>
                          setPatientFormData({ ...patientFormData, avoidIngredients: e.target.value })
                        }
                        placeholder="e.g., nuts, dairy, gluten"
                      />
                    </div>
                    <Button type="submit" disabled={isCreatingPatient}>
                      {isCreatingPatient ? 'Creating...' : 'Create Patient'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patients.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No patients yet</p>
              ) : (
                patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => fetchPatientDetails(patient.email)}
                  >
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                      {patient.doshaType && (
                        <p className="text-xs text-gray-500">Dosha: {patient.doshaType}</p>
                      )}
                    </div>
                    {patient.dietPlan && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Has Diet
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Diet Plans</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Diet Plan</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Diet Plan</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateDiet} className="space-y-4">
                    <div>
                      <Label htmlFor="patient">Patient</Label>
                      <Select
                        value={selectedPatient}
                        onValueChange={setSelectedPatient}
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="diet-mode">Diet Creation Mode</Label>
                      <Select
                        value={dietMode}
                        onValueChange={(value: 'manual' | 'generate') => setDietMode(value)}
                      >
                        <SelectTrigger>
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
                            <Label htmlFor="calories">Calories</Label>
                            <Input
                              id="calories"
                              type="number"
                              value={formData.calories}
                              onChange={(e) =>
                                setFormData({ ...formData, calories: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="protein">Protein (g)</Label>
                            <Input
                              id="protein"
                              type="number"
                              value={formData.protein}
                              onChange={(e) =>
                                setFormData({ ...formData, protein: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="carbs">Carbs (g)</Label>
                            <Input
                              id="carbs"
                              type="number"
                              value={formData.carbs}
                              onChange={(e) =>
                                setFormData({ ...formData, carbs: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="fat">Fat (g)</Label>
                            <Input
                              id="fat"
                              type="number"
                              value={formData.fat}
                              onChange={(e) =>
                                setFormData({ ...formData, fat: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="healthCondition">Health Condition</Label>
                          <Input
                            id="healthCondition"
                            value={formData.healthCondition}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                healthCondition: e.target.value,
                              })
                            }
                          />
                        </div>
                      </>
                    )}

                    {dietMode === 'generate' && (
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm text-blue-800">
                          Diet will be automatically generated based on the patient's Dosha type and avoid ingredients.
                        </p>
                      </div>
                    )}

                    <Button type="submit" disabled={isCreatingDiet}>
                      {isCreatingDiet ? 'Creating...' : 'Create Diet Plan'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diets.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No diet plans yet</p>
              ) : (
                diets.map((diet) => (
                  <Card key={diet.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{diet.patientName}</p>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(diet.createdAt).toLocaleDateString()}
                          </p>
                          {diet.calories && (
                            <p className="text-xs text-gray-500 mt-1">
                              {diet.calories} cal | {diet.protein}g protein | {diet.carbs}g carbs | {diet.fat}g fat
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Details Dialog */}
      {showPatientDetails && selectedPatientDetails && (
        <Dialog open={showPatientDetails} onOpenChange={setShowPatientDetails}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Patient Details - {selectedPatientDetails.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Email:</p>
                <p>{selectedPatientDetails.email}</p>
              </div>
              <div>
                <p className="font-semibold">Dosha Type:</p>
                <p>{selectedPatientDetails.doshaType || 'N/A'}</p>
              </div>
              {selectedPatientDetails.dietPlan && (
                <div>
                  <p className="font-semibold mb-2">Current Diet Plan:</p>
                  <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                    {selectedPatientDetails.dietPlan.type === 'manual' ? (
                      <>
                        <p className="mb-2"><strong>Type:</strong> Manual Entry</p>
                        <p>Calories: {selectedPatientDetails.dietPlan.calories}</p>
                        <p>Protein: {selectedPatientDetails.dietPlan.protein}g</p>
                        <p>Carbs: {selectedPatientDetails.dietPlan.carbs}g</p>
                        <p>Fat: {selectedPatientDetails.dietPlan.fat}g</p>
                        {selectedPatientDetails.dietPlan.healthCondition && (
                          <p>Health Condition: {selectedPatientDetails.dietPlan.healthCondition}</p>
                        )}
                      </>
                    ) : (
                      <div className="whitespace-pre-wrap font-mono text-sm">
                        {formatDietPlan(selectedPatientDetails.dietPlan) || 'Unable to format diet plan'}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!selectedPatientDetails.dietPlan && (
                <p className="text-gray-500">No diet plan created yet</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
