"use client";
import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { InfoIcon } from "lucide-react";
import { redirect, useRouter } from "next/navigation"; // Import useRouter
import { useEffect, useState } from "react";
import { Tables } from '../../types/supabase';
interface Question {
  query: string;
}
type Notes = Tables<'notes'>; 

export default function ProtectedPage({ notes, user }: { notes: any, user: any }) { 
  const [dynamicQuesLoading, setDynamicQuesLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    { query: "" },
  ]);
//   const [notes, setNotes] = useState([]);
  const [eventDescription, setEventDescription] = useState("");

  const supabase = createClient();
  const router = useRouter(); // Get the router instance
  // const { data: notes } = await supabase.from("notes").select().limit(2);
//   console.log(user)
  

  const addQuestionDynamic = async () => {
    setDynamicQuesLoading(true);
    try {
      const response = await fetch("/api/generateQuery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventDescription }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const generatedQuestions: Question = await response.json();
      console.log(generatedQuestions);
      setQuestions([...questions, generatedQuestions]);
    } catch (error) {
      console.error("Error generating questions:", error);
    }
    setDynamicQuesLoading(false);
  };

  const executeQuery = async (query: string) => {
    try {
      const { error } = await supabase.rpc('execute_query', {
        query_string: query
      });
      if (error) {
        console.error("Error executing query:", error);
      } else {
        // Query executed successfully, you might want to refetch data or update the UI
        console.log("Query executed successfully");
      }
    } catch (error) {
      console.error("Error executing query:", error);
    }
  }


  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div>
        <div className="flex flex-col gap-2"></div>
        <Textarea 
        placeholder="Query description"
        value={eventDescription}
        onChange={(e) => setEventDescription(e.target.value)}
        />
        <Button variant="secondary" type="button" className="my-4" onClick={addQuestionDynamic}>
          Generate Query
        </Button>
        <pre>{JSON.stringify(notes, null, 2)}</pre>
        <div className="">
            {questions.map((question)=>{
                return <div className=" p-4 rounded-lg">
                    <h2>{question.query}</h2>
                    <Button onClick={() => executeQuery(question.query)}>Execute Query</Button>
                </div>
            })}
        </div>
        {/* <FetchDataSteps /> */}
      </div>
    </div>
  );
}
