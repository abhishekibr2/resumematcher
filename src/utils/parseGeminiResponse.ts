// Utility function to parse Gemini response (ensure this is in src/utils/parseGeminiResponse.ts)
export const parseGeminiResponse = (response: string) => {
    const cleanedResponse = response
      .replace(/^```json\s*/, '')
      .replace(/```\s*$/, '')
      .trim();
  
    try {
      // Try to parse the cleaned response as JSON
      return JSON.parse(cleanedResponse);
    } catch (error) {
      // If parsing fails, return the original response
      console.error('Error parsing JSON:', error);
      return { original: response };
    }
  };