// src/app/api/quiz/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { eventDescription, questions } = await request.json();
console.log(eventDescription, questions)
  try {
    const options = {
      method: 'POST',
      url: 'https://api.worqhat.com/api/ai/content/v4',
      headers: {
        'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-96f006f61ebd416ea5b99c9ecaece174',
      },
      body: JSON.stringify({
        question: `You are the admin of a postgre sql Database. I want you to output an Sql query that makes the necessary 
        changes to the db. Here is what the user wants: ${eventDescription}. Return only the query parameter in the json.

        `,
        preserve_history: true,
        "model": "aicon-v4-nano-160824",
        randomness: 0.1,
        stream_data: false,
        training_data: 'You are an sql query generator',
        response_type: 'json',
      }),
    };

    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
    });

     
      const reader = response.body?.getReader();
      
      const decoder = new TextDecoder('utf-8');
      let result = '';

      while (true) {
        if (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value);
          }
       
      }

      const jsonResult = JSON.parse(result);
    const generatedText = jsonResult.content.trim();

    console.log(JSON.parse(generatedText).correct_answers);
    // const questions = generatedText.split('\n').map((question: string) => question.trim());

      return NextResponse.json(JSON.parse(generatedText));
    
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating quiz questions.' },
      { status: 500 }
    );
  }
}
