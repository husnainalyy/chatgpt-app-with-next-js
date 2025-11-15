import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { foodDescription } = await request.json();

    if (!foodDescription) {
      return NextResponse.json(
        { error: "Food description is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const prompt = `You are a nutrition expert. Analyze the following food description and return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this exact structure:

IMPORTANT RULES:
1. MEAL vs INGREDIENTS logic:
   - If items are part of a COMBO/DEAL/MEAL (like "Big Mac Meal", "Combo", "Deal", or items mentioned WITH each other using "with"): Create ONE meal with ALL items as ingredients
   - If items are SEPARATE/INDEPENDENT foods mentioned with "and", "vs", "versus", or comparison words: Create SEPARATE meals for each (for comparison)
   
2. Examples of ONE MEAL (items as ingredients):
   - "Big Mac deal" → 1 meal named "Big Mac Meal" with ingredients: Big Mac burger, fries, drink
   - "burger with fries and coke" → 1 meal with 3 ingredients
   - "chicken combo" → 1 meal with all combo items as ingredients
   - "pizza with wings" → 1 meal with 2 ingredients

3. Examples of SEPARATE MEALS (for comparison):
   - "pizza and burger" → 2 separate meals (Pizza card, Burger card)
   - "pizza vs burger" → 2 separate meals (Pizza card, Burger card)
   - "pizza versus burger" → 2 separate meals (Pizza card, Burger card)
   - "I had chicken then later ate ice cream" → 2 separate meals
   - "breakfast was eggs, lunch was sandwich" → 2 separate meals

4. Calculate dailyTotals as the sum of all meals' nutrients.
5. CRITICAL: For each meal, the total_nutrients MUST equal the sum of all ingredient nutrients. 
   - total_nutrients.calories = sum of all ingredient.nutrients.calories
   - total_nutrients.protein = sum of all ingredient.nutrients.protein
   - total_nutrients.carbs = sum of all ingredient.nutrients.carbs
   - total_nutrients.fat = sum of all ingredient.nutrients.fat
   - Calculate total_nutrients by adding up all ingredient values, do NOT estimate separately!
6. YOU MUST PROVIDE REALISTIC NUTRITIONAL VALUES - DO NOT USE ZEROS! Use standard serving sizes and accurate calorie/macro estimates.

{
  "dailyTotals": {
    "calories": <sum of all meals>,
    "protein": <sum of all meals in grams>,
    "carbs": <sum of all meals in grams>,
    "fat": <sum of all meals in grams>
  },
  "loggedMeals": [
    {
      "meal_name": "Meal Name",
      "meal_size": "Small/Medium/Large or specific size like '100g' or '6 pieces'",
      "total_nutrients": {
        "calories": <actual number>,
        "protein": <actual number in grams>,
        "carbs": <actual number in grams>,
        "fat": <actual number in grams>
      },
      "ingredients": [
        {
          "name": "Ingredient Name",
          "brand": "Brand Name or Generic",
          "serving_info": "1 serving (Xg) or specific portion",
          "nutrients": {
            "calories": <actual number>,
            "protein": <actual number in grams>,
            "carbs": <actual number in grams>,
            "fat": <actual number in grams>
          }
        }
      ]
    }
  ]
}

For a pizza slice: ~285 calories, 12g protein, 36g carbs, 10g fat
For a burger: ~540 calories, 25g protein, 40g carbs, 25g fat
For fries (medium): ~365 calories, 4g protein, 48g carbs, 17g fat
For a coke (medium): ~210 calories, 0g protein, 58g carbs, 0g fat

Food description: "${foodDescription}"

Return ONLY the JSON object with REAL nutritional values, nothing else.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a nutrition expert that returns ONLY valid JSON responses with no additional text or formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to process food data" },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    const content = responseData.choices[0].message.content;

    // Parse and validate the JSON response
    const data = JSON.parse(content);

    if (!data.dailyTotals || !data.loggedMeals) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 }
      );
    }

    // Validate and recalculate totals to ensure consistency
    const correctedMeals = data.loggedMeals.map((meal: any) => {
      if (meal.ingredients && meal.ingredients.length > 0) {
        // Calculate totals from ingredients
        const calculatedTotals = meal.ingredients.reduce(
          (acc: any, ingredient: any) => ({
            calories: acc.calories + (ingredient.nutrients?.calories || 0),
            protein: acc.protein + (ingredient.nutrients?.protein || 0),
            carbs: acc.carbs + (ingredient.nutrients?.carbs || 0),
            fat: acc.fat + (ingredient.nutrients?.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        // Round values
        calculatedTotals.calories = Math.round(calculatedTotals.calories);
        calculatedTotals.protein = Math.round(calculatedTotals.protein);
        calculatedTotals.carbs = Math.round(calculatedTotals.carbs);
        calculatedTotals.fat = Math.round(calculatedTotals.fat);

        // Use calculated totals to ensure consistency
        return {
          ...meal,
          total_nutrients: calculatedTotals,
        };
      }
      return meal;
    });

    // Recalculate dailyTotals from corrected meals
    const correctedDailyTotals = correctedMeals.reduce(
      (acc: any, meal: any) => ({
        calories: acc.calories + (meal.total_nutrients?.calories || 0),
        protein: acc.protein + (meal.total_nutrients?.protein || 0),
        carbs: acc.carbs + (meal.total_nutrients?.carbs || 0),
        fat: acc.fat + (meal.total_nutrients?.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Round daily totals
    correctedDailyTotals.calories = Math.round(correctedDailyTotals.calories);
    correctedDailyTotals.protein = Math.round(correctedDailyTotals.protein);
    correctedDailyTotals.carbs = Math.round(correctedDailyTotals.carbs);
    correctedDailyTotals.fat = Math.round(correctedDailyTotals.fat);

    return NextResponse.json({
      dailyTotals: correctedDailyTotals,
      loggedMeals: correctedMeals,
    });
  } catch (error) {
    console.error("Error analyzing food:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze food. Please try again.",
      },
      { status: 500 }
    );
  }
}

