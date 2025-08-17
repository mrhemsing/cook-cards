import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('API route called - checking environment variables...');

    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('OpenAI API key found, processing image...');

    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    console.log('Image received, size:', image.size, 'bytes');

    // Convert image to base64 for API calls
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    console.log('Image converted to base64, calling OpenAI...');

    // Use OpenAI GPT-4 Vision for recipe extraction
    const recipeData = await extractWithOpenAI(base64Image);

    console.log('OpenAI response received:', recipeData);

    return NextResponse.json(recipeData);
  } catch (error) {
    console.error('Recipe extraction error:', error);
    return NextResponse.json(
      {
        error: `Failed to extract recipe: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      },
      { status: 500 }
    );
  }
}

// OpenAI GPT-4 Vision approach
async function extractWithOpenAI(base64Image: string) {
  try {
    console.log('Making OpenAI API request...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this handwritten recipe card and extract the following information in JSON format:
                {
                  "title": "Recipe name",
                  "ingredients": "List of ingredients with measurements",
                  "instructions": "Step-by-step cooking instructions"
                }

                Please be as accurate as possible with the handwriting. If something is unclear, make your best guess.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(
        `OpenAI API request failed: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log('OpenAI response data:', data);

    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('OpenAI content:', content);

    // Try to parse JSON from the response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed JSON:', parsed);
        return parsed;
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
    }

    // Fallback: extract information from text
    console.log('Using fallback text extraction');
    return extractFromText(content);
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}

// Extract recipe information from OCR text
function extractFromText(text: string) {
  const lines = text.split('\n').filter(line => line.trim());

  let title = '';
  let ingredients = '';
  let instructions = '';

  // Simple heuristics to extract recipe parts
  let currentSection = 'title';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Look for common recipe section indicators
    const lowerLine = trimmedLine.toLowerCase();

    if (lowerLine.includes('ingredients') || lowerLine.includes('ingredient')) {
      currentSection = 'ingredients';
      continue;
    }

    if (
      lowerLine.includes('instructions') ||
      lowerLine.includes('directions') ||
      lowerLine.includes('method') ||
      lowerLine.includes('steps')
    ) {
      currentSection = 'instructions';
      continue;
    }

    // Assign content based on current section
    switch (currentSection) {
      case 'title':
        if (!title) title = trimmedLine;
        break;
      case 'ingredients':
        ingredients += (ingredients ? '\n' : '') + trimmedLine;
        break;
      case 'instructions':
        instructions += (instructions ? '\n' : '') + trimmedLine;
        break;
    }
  }

  return {
    title: title || 'Recipe Title',
    ingredients: ingredients || 'Ingredients will appear here',
    instructions: instructions || 'Instructions will appear here'
  };
}
