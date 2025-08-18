import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Convert base64 image to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Google Cloud Vision API configuration
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      console.error('Google Cloud Vision API key not configured');
      return NextResponse.json(
        { error: 'Google Vision API not configured' },
        { status: 500 }
      );
    }

    // Prepare the request for Google Vision API
    const visionRequest = {
      requests: [
        {
          image: {
            content: base64Data
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };

    // Call Google Cloud Vision API
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visionRequest)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API error:', response.status, errorText);
      throw new Error(`Google Vision API failed: ${response.status}`);
    }

    const visionResult = await response.json();

    // Extract text from the response
    const textAnnotations = visionResult.responses?.[0]?.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      return NextResponse.json({
        title: '',
        ingredients: '',
        instructions: ''
      });
    }

    // Get the full text (first annotation contains all text)
    const fullText = textAnnotations[0].description || '';

    // Parse the text to extract recipe components
    const recipeData = parseRecipeText(fullText);

    return NextResponse.json(recipeData);
  } catch (error) {
    console.error('Google Vision API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image with Google Vision' },
      { status: 500 }
    );
  }
}

// Function to parse recipe text and extract title, ingredients, and instructions
function parseRecipeText(text: string): {
  title: string;
  ingredients: string;
  instructions: string;
} {
  const lines = text.split('\n').filter(line => line.trim());

  let title = '';
  let ingredients = '';
  let instructions = '';

  // Common patterns for recipe sections
  const titlePatterns = [
    /^(recipe|dish|meal|food):\s*(.+)/i,
    /^(.+?)(?:recipe|dish|meal)$/i,
    /^([A-Z][A-Z\s&'-]+)$/ // All caps lines (common for titles)
  ];

  const ingredientPatterns = [
    /^(ingredients?|ing):\s*(.+)/i,
    /^(\d+[\/\d]*\s*(?:cup|tbsp|tsp|oz|lb|g|kg|ml|cl|pinch|dash|to taste).+)/i,
    /^([•\-\*]\s*.+)/i, // Bullet points
    /^(\d+\.\s*.+)/i // Numbered items
  ];

  const instructionPatterns = [
    /^(instructions?|directions?|steps?|method):\s*(.+)/i,
    /^(\d+\.\s*.+)/i, // Numbered steps
    /^([•\-\*]\s*.+)/i // Bullet points
  ];

  let currentSection = 'title';
  let sectionContent: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this line indicates a new section
    if (ingredientPatterns.some(pattern => pattern.test(trimmedLine))) {
      // Save previous section
      if (currentSection === 'title' && sectionContent.length > 0) {
        title = sectionContent.join(' ').trim();
      }
      currentSection = 'ingredients';
      sectionContent = [trimmedLine];
    } else if (instructionPatterns.some(pattern => pattern.test(trimmedLine))) {
      // Save ingredients section
      if (currentSection === 'ingredients' && sectionContent.length > 0) {
        ingredients = sectionContent.join('\n').trim();
      }
      currentSection = 'instructions';
      sectionContent = [trimmedLine];
    } else {
      // Add line to current section
      sectionContent.push(trimmedLine);
    }
  }

  // Save final section
  if (currentSection === 'title' && sectionContent.length > 0) {
    title = sectionContent.join(' ').trim();
  } else if (currentSection === 'ingredients' && sectionContent.length > 0) {
    ingredients = sectionContent.join('\n').trim();
  } else if (currentSection === 'instructions' && sectionContent.length > 0) {
    instructions = sectionContent.join('\n').trim();
  }

  // If we couldn't parse sections, try to make educated guesses
  if (!title && lines.length > 0) {
    title = lines[0].trim();
  }

  if (!ingredients && !instructions) {
    // Try to split remaining lines between ingredients and instructions
    const remainingLines = lines.slice(title ? 1 : 0);
    const midPoint = Math.ceil(remainingLines.length / 2);

    if (remainingLines.length > 0) {
      ingredients = remainingLines.slice(0, midPoint).join('\n').trim();
      instructions = remainingLines.slice(midPoint).join('\n').trim();
    }
  }

  return {
    title: title || 'Untitled Recipe',
    ingredients: ingredients || 'Ingredients not detected',
    instructions: instructions || 'Instructions not detected'
  };
}
