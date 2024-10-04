// src/app/api/quiz/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { eventDescription, tableNames, tableData } = await request.json();
console.log(eventDescription, tableData,tableNames)
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
        question: `You are the admin of a postgre sql Database. I want you to output an Sql query that makes the necessary 
        changes to the db. Here is what the user wants: ${eventDescription}. Return only the query parameter in the json. Follow the following rules: 
        1) The query must be in a proper syntax.
        2) If you are assuming anything, mention it, so that the user can provide more context.
        3) The default syntax should be that of SQL.
        4) Follow the examples mentioned in conversation history.
        Here are the existing tables in the database:
        ${JSON.stringify(tableNames)}
        Here is the data in the tables:
        ${JSON.stringify(tableData)}
        Use them while writing queries and make sure the column names and overall interface is correct.
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
