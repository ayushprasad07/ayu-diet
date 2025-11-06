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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading your diet plan...</p>
        </div>
      </div>
    );
  }

  const dietPlan = patient?.dietPlan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Subtle background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl p-6 mb-8 transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Welcome, {session?.user?.name}
              </h1>
              <p className="text-gray-600 mt-1">Your personalized nutrition journey</p>
            </div>
            <Button 
              onClick={() => router.push('/api/auth/signout')}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>
        </div>

        {/* Main content area */}
        {!dietPlan ? (
          <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="mb-6 p-6 bg-gradient-to-br from-green-100 to-blue-100 rounded-full">
                <svg className="w-20 h-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Diet Plan Yet</h3>
              <p className="text-gray-600 max-w-md mb-6">
                Your personalized diet plan is being prepared by your doctor. Check back soon!
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Please wait for your doctor to assign a diet plan</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Doctor info card */}
            {patient?.createdBy && (
              <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Your Doctor</p>
                    <p className="text-lg font-bold text-gray-800">Dr. {patient.createdBy.name}</p>
                    <p className="text-sm text-gray-600">{patient.createdBy.specialization}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Diet plan card */}
            <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
              <div className="p-6 border-b border-white/50 bg-gradient-to-r from-green-500/10 to-blue-500/10">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Your Diet Plan</h2>
                      {dietPlan.createdAt && (
                        <p className="text-sm text-gray-600">
                          Created: {new Date(dietPlan.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Active Plan</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {dietPlan.type === 'manual' ? (
                  <div className="space-y-6">
                    {/* Nutrition cards */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Nutritional Targets
                      </h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="backdrop-blur-md bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-200/50 rounded-xl p-5 transition-all duration-300 hover:scale-105">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-600">Calories</p>
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-3xl font-bold text-orange-600">{dietPlan.calories}</p>
                          <p className="text-xs text-gray-500 mt-1">kcal</p>
                        </div>

                        <div className="backdrop-blur-md bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-200/50 rounded-xl p-5 transition-all duration-300 hover:scale-105">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-600">Protein</p>
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-3xl font-bold text-blue-600">{dietPlan.protein}</p>
                          <p className="text-xs text-gray-500 mt-1">grams</p>
                        </div>

                        <div className="backdrop-blur-md bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-200/50 rounded-xl p-5 transition-all duration-300 hover:scale-105">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-600">Carbs</p>
                            <div className="p-2 bg-yellow-100 rounded-lg">
                              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-3xl font-bold text-yellow-600">{dietPlan.carbs}</p>
                          <p className="text-xs text-gray-500 mt-1">grams</p>
                        </div>

                        <div className="backdrop-blur-md bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-200/50 rounded-xl p-5 transition-all duration-300 hover:scale-105">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-600">Fat</p>
                            <div className="p-2 bg-red-100 rounded-lg">
                              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-3xl font-bold text-red-600">{dietPlan.fat}</p>
                          <p className="text-xs text-gray-500 mt-1">grams</p>
                        </div>
                      </div>
                    </div>

                    {/* Health condition */}
                    {dietPlan.healthCondition && (
                      <div className="backdrop-blur-md bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl p-5">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg mt-1">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 mb-2">Health Condition</h4>
                            <p className="text-gray-700">{dietPlan.healthCondition}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tips section */}
                    <div className="backdrop-blur-md bg-gradient-to-br from-green-50 to-blue-50 border border-green-200/50 rounded-xl p-5">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg mt-1">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-2">Quick Tips</h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                              Stay hydrated with 8-10 glasses of water daily
                            </li>
                            <li className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                              Eat smaller, frequent meals throughout the day
                            </li>
                            <li className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                              Track your progress and adjust as needed
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="backdrop-blur-md bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 max-h-[600px] overflow-y-auto">
                    <div className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                      {formatDietPlan(dietPlan) || 'Unable to format diet plan'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
