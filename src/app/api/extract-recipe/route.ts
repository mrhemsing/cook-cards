import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64 for API calls
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Option 1: Use Google Cloud Vision API (recommended for production)
    // const recipeData = await extractWithGoogleVision(base64Image);

    // Option 2: Use OpenAI GPT-4 Vision (alternative)
    const recipeData = await extractWithOpenAI(base64Image);

    // Option 3: Use a free OCR service (for development/testing)
    // const recipeData = await extractWithFreeOCR(base64Image);

    return NextResponse.json(recipeData);
  } catch (error) {
    console.error('Recipe extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract recipe' },
      { status: 500 }
    );
  }
}

// OpenAI GPT-4 Vision approach
async function extractWithOpenAI(base64Image: string) {
  try {
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

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Try to parse JSON from the response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
    }

    // Fallback: extract information from text
    return extractFromText(content);
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}

// Google Cloud Vision API approach (more accurate for OCR)
async function extractWithGoogleVision(base64Image: string) {
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Google Vision API request failed');
    }

    const data = await response.json();
    const text = data.responses[0]?.textAnnotations[0]?.description || '';

    return extractFromText(text);
  } catch (error) {
    console.error('Google Vision extraction error:', error);
    throw error;
  }
}

// Free OCR service approach (for development)
async function extractWithFreeOCR(base64Image: string) {
  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        apikey: process.env.OCR_SPACE_API_KEY || 'helloworld', // free tier key
        base64Image: base64Image,
        language: 'eng',
        isOverlayRequired: false,
        filetype: 'jpg',
        detectOrientation: true
      })
    });

    if (!response.ok) {
      throw new Error('OCR.space API request failed');
    }

    const data = await response.json();
    const text = data.ParsedResults?.[0]?.ParsedText || '';

    return extractFromText(text);
  } catch (error) {
    console.error('OCR.space extraction error:', error);
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
