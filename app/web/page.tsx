"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Type definitions (same as nmacros)
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

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    mealData?: MealData;
}

export default function WebPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/analyze-food", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ foodDescription: input.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to analyze food");
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Analyzed: ${input.trim()}`,
                mealData: data,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Error: ${error instanceof Error ? error.message : "Failed to analyze food. Please try again."}`,
                mealData: {
                    error: error instanceof Error ? error.message : "Failed to analyze food",
                },
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 px-4 py-3">
                <h1 className="text-lg font-semibold text-gray-900">Food Nutrition Analyzer</h1>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="mb-4">
                            <svg
                                className="w-12 h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Analyze Your Food Nutrition
                        </h2>
                        <p className="text-gray-500 max-w-md">
                            Enter a food description to get detailed nutritional information.
                            For example: "Big Mac Meal" or "pizza and burger"
                        </p>
                    </div>
                )}

                <div className="space-y-6">
                    {messages.map((message) => (
                        <div key={message.id} className="flex flex-col gap-4">
                            {/* User Message */}
                            {message.role === "user" && (
                                <div className="flex justify-end">
                                    <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-3">
                                        <p className="text-gray-900 whitespace-pre-wrap">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Assistant Message */}
                            {message.role === "assistant" && (
                                <div className="flex flex-col ">
                                    {message.mealData?.error ? (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-red-800">{message.mealData.error}</p>
                                        </div>
                                    ) : message.mealData?.loggedMeals ? (
                                        <div>
                                            {message.mealData.loggedMeals.map((meal, mealIndex, array) => {
                                                const isLastMeal = mealIndex === array.length - 1;
                                                return (
                                                    <div key={mealIndex} className="mb-0 shadow-none">
                                                        <MealCard 
                                                            meal={meal} 
                                                            isLast={isLastMeal}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-2xl px-4 py-3">
                                            <p className="text-gray-700">{message.content}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                            <span className="ml-2">Analyzing food nutrition...</span>
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 px-4 py-4">
                <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Describe the food you want to analyze..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none max-h-[200px]"
                            rows={1}
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="px-4 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}

// Meal Card Component (same as nmacros)
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
                        <div className=" rounded-b-2xl px-3">
                            <div className="  border-t border-gray-300">
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

