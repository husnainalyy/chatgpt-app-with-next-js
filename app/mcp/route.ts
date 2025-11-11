import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  // Get HTML for the macros widget page
  const macrosHtml = await getAppsSdkCompatibleHtml(baseURL, "/nmacros");

  // Define the macros widget
  const macrosWidget: ContentWidget = {
    id: "analyze_food",
    title: "Analyze Food Macros",
    templateUri: "ui://widget/macros-template.html",
    invoking: "Analyzing food nutrition...",
    invoked: "Food analysis complete",
    html: macrosHtml,
    description: "Analyzes food descriptions and displays nutritional information in meal cards",
    widgetDomain: baseURL,
  };

  // Register the resource (widget HTML)
  server.registerResource(
    "macros-widget",
    macrosWidget.templateUri,
    {
      title: macrosWidget.title,
      description: macrosWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": macrosWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${macrosWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": macrosWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": macrosWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // Register the tool
  server.registerTool(
    macrosWidget.id,
    {
      title: macrosWidget.title,
      description: `You are a nutrition expert. When given a food description, you MUST analyze it using your built-in nutrition knowledge and generate a complete JSON object with nutritional information.

CRITICAL: You must analyze the food description and generate the complete meal data BEFORE returning the tool response. The structuredContent field MUST contain:
- dailyTotals: { calories: number, protein: number, carbs: number, fat: number }
- loggedMeals: array of complete meal objects with ingredients

STEP-BY-STEP PROCESS:
1. Read the foodDescription parameter
2. Use your nutrition knowledge to analyze the food
3. Extract weight/portion information (e.g., "100g", "medium", "large")
4. Calculate accurate nutritional values based on standard serving sizes
5. Group items into meals according to the rules below
6. Generate the complete JSON structure with dailyTotals and loggedMeals
7. Return this complete data in the structuredContent field

YOU MUST GENERATE THE COMPLETE ANALYSIS - do not return placeholder values or null.

RULES FOR MEAL GROUPING:
- If items are part of a COMBO/MEAL/DEAL or mentioned WITH each other: Create ONE meal with items as ingredients
- If items are separate (mentioned with "and" but not a combo): Create separate meals
- Always provide realistic nutritional values - never use zeros
- Calculate dailyTotals as the sum of all meals' nutrients

REQUIRED JSON STRUCTURE (return this exact format):
{
  "dailyTotals": {
    "calories": <number - sum of all meals>,
    "protein": <number in grams - sum of all meals>,
    "carbs": <number in grams - sum of all meals>,
    "fat": <number in grams - sum of all meals>
  },
  "loggedMeals": [
    {
      "meal_name": "<meal name>",
      "meal_size": "<size or weight from description, e.g., '100g', 'Medium', '6 pieces'>",
      "total_nutrients": {
        "calories": <number>,
        "protein": <number in grams>,
        "carbs": <number in grams>,
        "fat": <number in grams>
      },
      "ingredients": [
        {
          "name": "<ingredient name>",
          "brand": "<brand name or 'Generic'>",
          "serving_info": "<serving description, e.g., '1 serving (100g)'>",
          "nutrients": {
            "calories": <number>,
            "protein": <number in grams>,
            "carbs": <number in grams>,
            "fat": <number in grams>
          }
        }
      ]
    }
  ]
}

EXAMPLES:
- "100g blueberries" → 1 meal with 57 calories, 1g protein, 14g carbs, 0g fat
- "Big Mac meal" → 1 meal with ingredients: Big Mac, fries, drink
- "pizza and burger" → 2 separate meals`,
      inputSchema: {
        foodDescription: z
          .string()
          .describe(
            "The food description from the user (e.g., 'I had 100g of blueberries', 'Big Mac meal', 'pizza and burger')"
          ),
      },
      _meta: widgetMeta(macrosWidget),
    },
    async ({ foodDescription }) => {
      try {
        // IMPORTANT: ChatGPT must analyze the food and return complete meal data
        // The tool description above provides detailed instructions
        // ChatGPT will use its native model to analyze the foodDescription
        // and generate the structuredContent with dailyTotals and loggedMeals
        
        // Return structure - ChatGPT will populate this based on its analysis
        // The content text provides explicit instructions for ChatGPT to follow
        return {
          content: [
            {
              type: "text",
              text: `Analyze this food: "${foodDescription}"

You MUST analyze this food using your nutrition knowledge and return a complete JSON object. Generate the analysis NOW and return it in this exact format (valid JSON only, no markdown, no code blocks):

{
  "dailyTotals": {
    "calories": <number>,
    "protein": <number>,
    "carbs": <number>,
    "fat": <number>
  },
  "loggedMeals": [
    {
      "meal_name": "<meal name>",
      "meal_size": "<size>",
      "total_nutrients": {
        "calories": <number>,
        "protein": <number>,
        "carbs": <number>,
        "fat": <number>
      },
      "ingredients": [
        {
          "name": "<ingredient name>",
          "brand": "<brand>",
          "serving_info": "<serving info>",
          "nutrients": {
            "calories": <number>,
            "protein": <number>,
            "carbs": <number>,
            "fat": <number>
          }
        }
      ]
    }
  ]
}

Return ONLY the JSON object with real nutritional values.`,
            },
          ],
          structuredContent: {
            // ChatGPT MUST analyze "${foodDescription}" and replace these placeholder values
            // with real nutritional data based on your analysis
            foodDescription: foodDescription,
            // REPLACE THESE PLACEHOLDERS with actual analyzed data:
            dailyTotals: {
              calories: 0, // Replace with calculated value
              protein: 0,   // Replace with calculated value  
              carbs: 0,    // Replace with calculated value
              fat: 0       // Replace with calculated value
            },
            loggedMeals: [] // Replace with array of analyzed meal objects
          },
          _meta: widgetMeta(macrosWidget),
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error processing food analysis request: ${foodDescription}`,
            },
          ],
          structuredContent: {
            error: error instanceof Error ? error.message : "Failed to analyze food. Please try again.",
          },
          _meta: widgetMeta(macrosWidget),
        };
      }
    }
  );
});

export const GET = handler;
export const POST = handler;