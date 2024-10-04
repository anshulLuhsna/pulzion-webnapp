// src/app/api/quiz/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { result: requestResult } = await request.json();
console.log("Here are the results:",    requestResult)
  try {
    const options = {
      method: 'POST',
      url: 'https://api.worqhat.com/api/ai/content/v4',
      headers: {
        'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-92426c0957c64a869f5cf988d27b90ad',
      },
      body: JSON.stringify({
        question: `
        Tell me if I can visualize this result: Return true or false, type of graph (Always return 'Bar Chart' for now) and chart data to plot that can be plotted on recharts.
        eg: canVisualize: true, graphType: Bar Chart, chartData: [...]
        Use the following data to give the chartData: ${requestResult}
        `,
        preserve_history: true,
        "model": "aicon-v4-nano-160824",
        "conversation_history":[
          {
            "Input":"Show me all the values from the student table",
            "Output": "SELECT * FROM student"
        },
        {
            "Input":"Show me all the values from the teacher table",
            "Output": "SELECT * FROM teacher"
        },
        {
            "Input":"Insert the following into the student table. Name - Anurag, RollNo - 52, Department - Computer Engineering",
            "Output": "INSERT INTO student VALUES('Anurag', 52, 'Computer Engineering')"
        },
        {
            "Input": "Which teachers are teaching the student with the name of Kevin?",
            "Output": "db.students.aggregate([{$match: {name: 'Kevin'}},{ $lookup: {from: 'teachers',localField: 'teacherIds',foreignField: 'id',as: 'teachers'}},{$unwind: '$teachers'},{$project: {id: 0,studentName: '$name', teacherName: '$teachers.name'}}])"
        }
        ],
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
