"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useWidgetProps, useMaxHeight } from "../hooks";

interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Ingredient {
  name: string;
  brand?: string;
  serving_info: string;
  nutrients: Nutrients;
}

interface Meal {
  meal_name: string;
  meal_size?: string;
  ingredients: Ingredient[];
  total_nutrients: Nutrients;
}

interface MealData {
  dailyTotals?: Nutrients;
  loggedMeals?: Meal[];
  error?: string;
}

export default function Macros() {
  const [isLoading, setIsLoading] = useState(true);
  const maxHeight = useMaxHeight();
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: MealData;
    };
    structuredContent?: MealData;
    error?: string;
  }>();

  let mealData: MealData | null = null;

  if (toolOutput?.result?.structuredContent) {
    mealData = toolOutput.result.structuredContent as MealData;
  } else if (toolOutput?.structuredContent) {
    mealData = toolOutput.structuredContent as MealData;
  } else if (toolOutput?.result) {
    mealData = toolOutput.result as MealData;
  } else if (toolOutput && typeof toolOutput === 'object') {
    if ('loggedMeals' in toolOutput || 'dailyTotals' in toolOutput) {
      mealData = toolOutput as MealData;
    }
  }

  const error = mealData?.error || toolOutput?.error;
  const meals = mealData?.loggedMeals || [];

  useEffect(() => {
    if (meals.length > 0) {
      setIsLoading(false);
      return;
    }

    if (toolOutput === null) {
      setIsLoading(true);
      return;
    }

    if (toolOutput && typeof toolOutput === 'object') {
      const hasFoodDescription = 'foodDescription' in toolOutput;
      const hasMeals = 'loggedMeals' in toolOutput && Array.isArray(toolOutput.loggedMeals) && toolOutput.loggedMeals.length > 0;

      if (hasFoodDescription && !hasMeals) {
        setIsLoading(true);
        return;
      }
    }

    setIsLoading(false);
  }, [meals.length, toolOutput]);

  if (error) {
    return (
      <div
        className="bg-white text-black font-sans"
        style={{ maxHeight: maxHeight ?? undefined }}
      >
        <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-sm sm:text-base text-red-800">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="bg-white text-black font-sans"
        style={{ maxHeight: maxHeight ?? undefined }}
      >
        <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mb-4"></div>
            <p className="text-gray-600 text-base font-medium">Analyzing food nutrition...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait</p>
          </div>
        </main>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div
        className="bg-white text-black font-sans p-4"
        style={{ maxHeight: maxHeight ?? undefined }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500 text-center">No meal data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white text-black font-sans"
      style={{ maxHeight: maxHeight ?? undefined }}
    >
      <main className="max-w-4xl mx-auto py-3 sm:py-4">
        <div className="space-y-4">
          {meals.map((meal, mealIndex, array) => {
            const isLastMeal = mealIndex === array.length - 1;
            return (
              <div key={mealIndex} className="mb-0 shadow-none">
                <MealCard meal={meal} isLast={isLastMeal} />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

interface MealCardProps {
  meal: Meal;
  isLast?: boolean;
}

function MealCard({ meal, isLast = false }: MealCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const hasMultipleIngredients = meal.ingredients.length > 1;

  const borderClass = isLast ? "border-b-0" : "border-b border-gray-200";

  return (
    <div className="flex justify-center w-full">
      <div className={`w-2xl py-4 ${borderClass}`}>
        <div className="flex justify-between items-center gap-3 p-4 pt-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="Meal icon"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-normal text-gray-900">
                {meal.meal_name}
              </h3>
              {meal.meal_size && (
                <p className="text-lg text-gray-500">
                  {meal.meal_size}
                </p>
              )}
            </div>
          </div>

          <div>
            {hasMultipleIngredients && (
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex-shrink-0 w-14 h-14  bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                aria-label={showBreakdown ? "Hide breakdown" : "Show breakdown"}
              >
                <svg
                  className={`w-8 h-8  text-gray-600 transition-transform ${showBreakdown ? "rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 "></div>
        {/* nutrition grid */}
        <div className="px-6 pt-4 flex flex-col">

          <div className="flex justify-between px-8 sm:gap-4">
            <div className="flex flex-col justify-center items-center  gap-1">
              <p className="text-sm sm:text-base text-gray-500">Calories</p>
              <p className="text-lg sm:text-xl font-normal text-gray-900">
                {Math.round(meal.total_nutrients.calories)}
              </p>
            </div>
            <div className="flex flex-col justify-center items-center  gap-1">
              <p className="text-sm sm:text-base text-gray-500">Protein (g)</p>
              <p className="text-lg sm:text-xl font-normal text-gray-900">
                {Math.round(meal.total_nutrients.protein)}
              </p>
            </div>
            <div className="flex flex-col justify-center items-center  gap-1">
              <p className="text-sm sm:text-base text-gray-500">Carbs (g)</p>
              <p className="text-lg sm:text-xl font-normal text-gray-900">
                {Math.round(meal.total_nutrients.carbs)}
              </p>
            </div>
            <div className="flex flex-col justify-center items-center  gap-1">
              <p className="text-sm sm:text-base text-gray-500">Fat (g)</p>
              <p className="text-lg sm:text-xl font-normal text-gray-900">
                {Math.round(meal.total_nutrients.fat)}
              </p>
            </div>
          </div>
          {/* nutrition breakdown */}
          {showBreakdown && hasMultipleIngredients && (
            <div className=" rounded-b-2xl ">
              <div className="border-t border-gray-300"></div>
              <div className=" px-3 ">
                {meal.ingredients.map((ingredient, ingredientIndex) => (
                  <div
                    key={ingredientIndex}
                    className={`py-2 rounded ${ingredientIndex % 2 === 0 ? "bg-gray-100" : "bg-gray-50"}`}
                  >
                    {/* Ingredient name on the left */}
                    <div className="mb-2">
                      <span className="text-gray-500 text-xs sm:text-sm px-4">
                        {ingredient.name}
                        {ingredient.serving_info &&
                          ` (${ingredient.serving_info})`}
                      </span>
                    </div>
                    {/* Values in 4-column grid aligned with headers above */}
                    <div className="flex justify-between px-8 sm:gap-4">
                      <div className="flex flex-col justify-center items-center gap-1">
                        <p className="text-lg sm:text-xl font-normal text-gray-900">
                          {Math.round(ingredient.nutrients.calories)}
                        </p>
                      </div>
                      <div className="flex flex-col justify-center items-center gap-1">
                        <p className="text-lg sm:text-xl font-normal text-gray-900">
                          {Math.round(ingredient.nutrients.protein)}
                        </p>
                      </div>
                      <div className="flex flex-col justify-center items-center gap-1">
                        <p className="text-lg sm:text-xl font-normal text-gray-900">
                          {Math.round(ingredient.nutrients.carbs)}
                        </p>
                      </div>
                      <div className="flex flex-col justify-center items-center gap-1">
                        <p className="text-lg sm:text-xl font-normal text-gray-900">
                          {Math.round(ingredient.nutrients.fat)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}