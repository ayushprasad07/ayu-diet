'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DietPlan {
  type?: 'manual' | 'generated';
  dosha?: string;
  plan?: any;
  avoidIngredients?: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  healthCondition?: string;
  createdAt?: string;
}

interface Patient {
  dietPlan?: DietPlan;
  createdBy?: {
    name: string;
    email: string;
    specialization: string;
  };
}

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'patient') {
      router.push('/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchDiet = async () => {
      try {
        const response = await fetch('/api/patient/get-diet');
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
        }
      } catch (error) {
        console.error('Failed to fetch diet:', error);
      }
    };

    fetchDiet();
  }, []);

  const formatDietPlan = (dietPlan: DietPlan) => {
    if (!dietPlan || dietPlan.type === 'manual') {
      return null;
    }

    const { dosha, plan, avoidIngredients, createdAt } = dietPlan;
    let formatted = '';

    formatted += `📋 Diet Plan Details\n`;
    formatted += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    formatted += `Dosha Type: ${dosha || 'N/A'}\n`;
    if (avoidIngredients && avoidIngredients.length > 0) {
      formatted += `Ingredients to Avoid: ${avoidIngredients.join(', ')}\n`;
    }
    if (createdAt) {
      formatted += `Created: ${new Date(createdAt).toLocaleDateString()}\n`;
    }
    formatted += `\n`;

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

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const dietPlan = patient?.dietPlan;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Welcome, {session?.user?.name}
        </h1>
        <Button onClick={() => router.push('/api/auth/signout')}>
          Logout
        </Button>
      </div>

      {!dietPlan ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-4">🥗</div>
            <h3 className="text-xl font-semibold mb-2">No Diet Plan Yet</h3>
            <p className="text-gray-600">
              Please wait for your doctor to assign a diet plan for you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Diet Plan</CardTitle>
              {patient?.createdBy && (
                <p className="text-sm text-gray-600">
                  By Dr. {patient.createdBy.name}
                </p>
              )}
            </div>
            {dietPlan.createdAt && (
              <p className="text-sm text-gray-600">
                Created: {new Date(dietPlan.createdAt).toLocaleDateString()}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {dietPlan.type === 'manual' ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Calories</p>
                    <p className="font-semibold">{dietPlan.calories} kcal</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Protein</p>
                    <p className="font-semibold">{dietPlan.protein}g</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Carbs</p>
                    <p className="font-semibold">{dietPlan.carbs}g</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Fat</p>
                    <p className="font-semibold">{dietPlan.fat}g</p>
                  </div>
                </div>
                {dietPlan.healthCondition && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Health Condition</h4>
                    <p className="text-gray-600">{dietPlan.healthCondition}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg max-h-[600px] overflow-y-auto">
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {formatDietPlan(dietPlan) || 'Unable to format diet plan'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}