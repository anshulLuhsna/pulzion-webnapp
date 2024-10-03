"use client";
import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { InfoIcon } from "lucide-react";
import { redirect, useRouter } from "next/navigation"; // Import useRouter
import { useEffect, useState } from "react";
import { Tables } from '../../types/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface Question {
  query: string;
}
type Notes = Tables<'notes'>;

export default function ProtectedPage({ notes, user }: { notes: any, user: any }) {
  const [dynamicQuesLoading, setDynamicQuesLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    { query: "" },
  ]);
  const [eventDescription, setEventDescription] = useState("");
  const [dbType, setDbType] = useState("sqlite"); // Default to SQLite
  interface DbParams {
    db?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string; // Changed dbname to database for MongoDB
    collection?: string; // Added for MongoDB
  }

  const [dbParams, setDbParams] = useState<DbParams>({});
  const [questionInput, setQuestionInput] = useState("");
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [queryResults, setQueryResults] = useState([]);

  const supabase = createClient();
  const router = useRouter();

  const handleDbTypeChange = (selectedDbType: string) => {
    setDbType(selectedDbType);
    setDbParams({}); // Reset parameters when database type changes
  };

  const handleDbParamChange = (paramName: string, value: any) => {
    setDbParams((prevParams) => ({ ...prevParams, [paramName]: value }));
  };

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
  const askQuestion = async () => {
    // ... (Get question, dbType, and dbParams from your UI)

    try {
      const generateQueryResponse = await fetch('http://localhost:5000/generate_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionInput })
      });

      const generateQueryData = await generateQueryResponse.json();
      const generatedQuery = generateQueryData.query;
      console.log(generatedQuery)
      setGeneratedQuery(generatedQuery); // Update the generatedQuery state

      const executeQueryResponse = await fetch('http://localhost:5000/execute_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: generatedQuery, dbType, dbParams }),
      });

      const executeQueryData = await executeQueryResponse.json();
      const results = executeQueryData.results;
      console.log(results)
      setQueryResults(results); // Update the queryResults state
      // ... (Update your UI with the generatedQuery and results)
    } catch (error) {
      // ... (Handle errors)
    }
  };

  return (
    <div className="flex w-full h-screen">
      {/* Sidebar (25% width) */}
      <div className="w-1/4  p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Database Type: {dbType}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Select Database Type</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleDbTypeChange("sqlite")}>
              SQLite
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDbTypeChange("postgresql")}>
              PostgreSQL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDbTypeChange("mysql")}>
              MySQL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDbTypeChange("mongodb")}>
              MongoDB
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDbTypeChange("Supabase")}>
              Supabase
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Database Parameters */}
        {dbType === "sqlite" && (
          <div className="mt-4">
            <Input
              placeholder="SQLite DB name"
              value={dbParams.db || ""}
              onChange={(e) => handleDbParamChange("db", e.target.value)}
            />
          </div>
        )}
        {dbType === "postgresql" && (
          <div className="mt-4 space-y-2">
            <Input
              placeholder="PostgreSQL Host"
              value={dbParams.host || ""}
              onChange={(e) => handleDbParamChange("host", e.target.value)}
            />
            <Input
              placeholder="PostgreSQL Port"
              type="number"
              value={dbParams.port || ""}
              onChange={(e) => handleDbParamChange("port", parseInt(e.target.value))}
            />
            <Input
              placeholder="PostgreSQL User"
              value={dbParams.user || ""}
              onChange={(e) => handleDbParamChange("user", e.target.value)}
            />
            <Input
              placeholder="PostgreSQL Password"
              type="password"
              value={dbParams.password || ""}
              onChange={(e) => handleDbParamChange("password", e.target.value)}
            />
            <Input
              placeholder="PostgreSQL Database Name"
              value={dbParams.database || ""} // Use database instead of dbname
              onChange={(e) => handleDbParamChange("database", e.target.value)}
            />
          </div>
        )}
        {dbType === "mysql" && (
          // Add similar input fields for MySQL
          <div className="mt-4 space-y-2">
            <Input
              placeholder="MySQL Host"
              value={dbParams.host || ""}
              onChange={(e) => handleDbParamChange("host", e.target.value)}
            />
            <Input
              placeholder="MySQL Port"
              type="number"
              value={dbParams.port || ""}
              onChange={(e) => handleDbParamChange("port", parseInt(e.target.value))}
            />
            <Input
              placeholder="MySQL User"
              value={dbParams.user || ""}
              onChange={(e) => handleDbParamChange("user", e.target.value)}
            />
            <Input
              placeholder="MySQL Password"
              type="password"
              value={dbParams.password || ""}
              onChange={(e) => handleDbParamChange("password", e.target.value)}
            />
            <Input
              placeholder="MySQL Database Name"
              value={dbParams.database || ""} // Use database instead of dbname
              onChange={(e) => handleDbParamChange("database", e.target.value)}
            />
          </div>
        )}
        {dbType === "mongodb" && (
          // Add input fields for MongoDB
          <div className="mt-4 space-y-2">
            <Input
              placeholder="MongoDB Host"
              value={dbParams.host || ""}
              onChange={(e) => handleDbParamChange("host", e.target.value)}
            />
            <Input
              placeholder="MongoDB Port"
              type="number"
              value={dbParams.port || ""}
              onChange={(e) => handleDbParamChange("port", parseInt(e.target.value))}
            />
            <Input
              placeholder="MongoDB Database Name"
              value={dbParams.database || ""}
              onChange={(e) => handleDbParamChange("database", e.target.value)}
            />
            <Input
              placeholder="MongoDB Collection Name"
              value={dbParams.collection || ""}
              onChange={(e) => handleDbParamChange("collection", e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Main Content (75% width) */}
      <div className="flex-1 w-3/4 p-8">
        <div className="flex flex-col gap-12">
          {dbType === "Supabase" && (
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
              {questions.map((question) => {
                return <div className=" p-4 rounded-lg">
                  <h2>{question.query}</h2>
                  <Button onClick={() => executeQuery(question.query)}>Execute Query</Button>
                </div>
              })}
            </div>
            {/* <FetchDataSteps /> */}
          </div>
          )

          }
          
          {
            dbType !== "Supabase" && (
<div>
            <Input
              placeholder="Input your question in natural language"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
            />
            <Button onClick={askQuestion}>Ask the question</Button>

            {generatedQuery && (
              <div>
                <h3>Generated SQL/Query:</h3>
                <pre>{generatedQuery}</pre>
              </div>
            )}

            {queryResults?.length > 0 && (
              <div>
                <h3>Query Results:</h3>
                <ul>
                  {queryResults.map((row, index) => (
                    <li key={index}>{JSON.stringify(row)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
            )
          }
          
        </div>
      </div>
    </div>
  );
}
