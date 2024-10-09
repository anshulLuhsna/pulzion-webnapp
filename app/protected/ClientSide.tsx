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
import { exec } from "child_process";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'react-toastify'; // Import toast
import 'react-toastify/dist/ReactToastify.css'; // Import toast CSS
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
  PieChart, Pie, Cell 
} from 'recharts'; // Import Recharts components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Question {
  query: string;
  status?: "success" | "error" | "retrying";
  error?: string;
}
type Notes = Tables<'notes'>;

export default function ProtectedPage({ tableNames, user, tableData }: { user: any, tableNames: any, tableData: any }) {
  const [naturalLanguageResponse, setNaturalLanguageResponse] = useState("");
  const [summary, setSummary] = useState("");
  const [dynamicQuesLoading, setDynamicQuesLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    { query: "" },
  ]);
  const [activeChart, setActiveChart] = useState('bar'); // State to manage active chart type
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
  useEffect(() => {
    console.log("Here", tableData, tableNames)
  }, [tableData, tableNames]);
  const [dbParams, setDbParams] = useState<DbParams>({});
  const [visualLoading, setVisualLoading] = useState(false)
  const [questionInput, setQuestionInput] = useState("");
  const [generatedQuery, setGeneratedQuery] = useState<string[]>([]);
  const [queryResults, setQueryResults] = useState([]);
  const [queryStatus, setQueryStatus] = useState<string | null>("Running this query");
  const [chartData, setChartData] = useState<any[]>([]); // State to store chart data
  const [chartType, setChartType] = useState<string | null>(null); // State to store chart type
  const [canVisualize, setCanVisualize] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const supabase = createClient();
  const router = useRouter();

  const handleDbTypeChange = (selectedDbType: string) => {
    setDbType(selectedDbType);
    setDbParams({});
  };
  // console.log("Here",tableData,tableNames)
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
        body: JSON.stringify({ eventDescription, tableData, tableNames }),
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

  const visualize = async (result: any) => {
    setVisualLoading(true)
    console.log(result)
    try {
      const response = await fetch("/api/visualize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ result, generatedQuery }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const visualizationData: any = await response.json();
      // console.log(generatedQuestions)
      console.log("Visualize: ", visualizationData);

      if (visualizationData.canVisualize) {
        setCanVisualize(true)
        // Prepare data for Recharts
        const chartData = visualizationData.chartData || []; // Assuming the API provides chartData
        setChartData(chartData); 
        console.log(visualizationData.chartData)
        setChartType(visualizationData.graphType);

        toast.success("Data visualized!"); 
      } else {
        toast.info("Data cannot be visualized in a meaningful way.");
      }

    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error("Error checking visualization options.");
    }
    setVisualLoading(false)
    setQueryStatus("Query executed successfully")
  };

  const executeQuery = async (query: string, questionIndex: number) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) =>
        i === questionIndex ? { ...q, status: "retrying" } : q
      )
    );

    try {
      const { error } = await supabase.rpc('execute_query', {
        query_string: query
      });
      if (error) {
        console.error("Error executing query:", error);
        toast.error("Error executing query");

        setQuestions((prevQuestions) =>
          prevQuestions.map((q, i) =>
            i === questionIndex ? { ...q, status: "error", error: (error as unknown as Error).message } : q
          )
        );

        let newEventDescription = eventDescription + " " + error.message;
        try {
          const response = await fetch("/api/generateQuery", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventDescription: newEventDescription,
              tableData,
              tableNames,
            }),
          });

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }

          const generatedQuestions: Question = await response.json();
          console.log("Retried query:", generatedQuestions.query);

          setQuestions((prevQuestions) => [
            ...prevQuestions,
            { ...generatedQuestions, status: "retrying" },
          ]);

          executeQuery(generatedQuestions.query, questions.length);
        } catch (retryError) {
          console.error("Error retrying query:", retryError);
          toast.error("Error retrying query");

          setQuestions((prevQuestions) =>
            prevQuestions.map((q, i) =>
              i === questions.length - 1 ? { ...q, status: "error", error: (retryError as Error).message } : q
            )
          );
        }

      } else {
        console.log("Query executed successfully");
        toast.success("Query executed successfully");

        const { data: tableNames, error: tableNamesError } = await supabase.rpc('get_all_table_names')
        const tableDataPromises = (tableNames || []).map(async (tableName: any) => {
          const { data, error } = await supabase.from(tableName).select();
          if (error) {
            console.error(`Error fetching data for ${tableName}:`, error);
            return [tableName, []];
          }
          return [tableName, data];
        });

        const tableDataArray = await Promise.all(tableDataPromises);
        let tableData = Object.fromEntries(tableDataArray);
        console.log(tableData)
        if (tableNamesError) {
          console.error("Error fetching table data:", tableNamesError);
        } else {
          const updatedTableData: Record<string, any> = {};

          console.log(updatedTableData)
        }

        setQuestions((prevQuestions) =>
          prevQuestions.map((q, i) =>
            i === questionIndex ? { ...q, status: "success" } : q
          )
        );
      }
    } catch (error) {
      console.error("Error executing query:", error);
      toast.error("Error executing query");

      setQuestions((prevQuestions) =>
        prevQuestions.map((q, i) =>
          i === questionIndex ? { ...q, status: "error", error: (error as Error).message } : q
        )
      );
    }
  }
  const askQuestion = async () => {
    setShowSkeleton(true)
    setCanVisualize(false)
    setChartData([])
    setEventDescription("")
    setGeneratedQuery([])
    setQueryResults([])
    setNaturalLanguageResponse("")
    setQueryStatus("Running this query")
    try {
      const generateQueryResponse = await fetch('http://localhost:5000/generate_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionInput, dbType, dbParams }),
      });

      const generateQueryData = await generateQueryResponse.json();
      const generatedQuery = generateQueryData.query;
      console.log(generatedQuery)
      // setGeneratedQuery(generatedQuery);
      setGeneratedQuery((prevQueries) => [...prevQueries, generatedQuery]);

      const executeQueryResponse = await fetch('http://localhost:5000/execute_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: generatedQuery, dbType, dbParams }),
      });

      const executeQueryData = await executeQueryResponse.json();
      const results = executeQueryData.results;
      console.log("SQL query: ", executeQueryData.sql_query)
      setGeneratedQuery((prevQueries) => {
        if (prevQueries.includes(executeQueryData.sql_query)) {
          return prevQueries;
        }
        return [...prevQueries, executeQueryData.sql_query];
      });
      visualize(results); // Call visualize function here 
      setNaturalLanguageResponse(executeQueryData.natural_language_response);
      setSummary(executeQueryData.summary);
      console.log(results, executeQueryData.natural_language_response);
      console.log(executeQueryData.summary);
      setQueryResults(results);
      setShowSkeleton(false)

    } catch (error) {
      // ... (Handle errors)
    }
  };

  // Sample data for PieChart (replace with your actual data)
  const pieChartData = [
    { name: 'Category A', value: 400 },
    { name: 'Category B', value: 300 },
    { name: 'Category C', value: 300 },
    { name: 'Category D', value: 200 },
  ];

  // Colors for PieChart slices
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="flex w-full h-screen">
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
            
            <DropdownMenuItem onClick={() => handleDbTypeChange("mysql")}>
              MySQL
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleDbTypeChange("Supabase")}>
              Supabase
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
              value={dbParams.database || ""}
              onChange={(e) => handleDbParamChange("database", e.target.value)}
            />
          </div>
        )}
        {dbType === "mysql" && (
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
              value={dbParams.database || ""}
              onChange={(e) => handleDbParamChange("database", e.target.value)}
            />
          </div>
        )}
        {dbType === "mongodb" && (
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

              <div className="">
                {questions.map((question, index) => (
                  <div key={index} className="p-4 rounded-lg">
                    <h2>{question.query}</h2>
                    {question.status === "error" && (
                      <div className="text-red-500">Error: {question.error}</div>
                    )}
                    {question.status === "retrying" && (
                      <div className="text-blue-500">Retrying...</div>
                    )}
                    {question.query && question.status !== "retrying" && (
                      <Button onClick={() => executeQuery(question.query, index)}>
                        Execute Query
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {Object.keys(tableData).map((tableName) => (
                <div key={tableName} className="border rounded-md p-4">
                  <h2 className="text-xl font-semibold mb-2">{tableName}</h2>
                  {tableData[tableName]?.length > 0 ? (
                    <Table>
                      <TableCaption>List of {tableName}</TableCaption>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(tableData[tableName][0]).map((header) => (
                            <TableHead key={header}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData[tableName].map((row: Record<string, any>, index: number) => (
                          <TableRow key={index}>
                            {Object.values(row).map((cell, cellIndex) => (
                              <TableCell key={cellIndex}>{cell}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>No data found for {tableName}</p>
                  )}
                </div>
              ))}
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
                <Button className="my-4" onClick={askQuestion}>Ask the question</Button>

              {generatedQuery.length == 0 && showSkeleton && (
                 <>
                 <Skeleton className="h-12 w-full my-2" />
                 <Skeleton className="h-12 w-full my-2" />
                 
                 </>
              )}
                {generatedQuery.length > 0 && (
                  <div className="border border-gray-300 rounded-lg p-4 shadow-md bg-gray-800 text-white mt-6">
                  <h3 className="my-4 text-xl ">Generated SQL/Query:</h3>
                  {generatedQuery.map((query, index) => (
                  <div key={index} className="my-4">
                  {index === generatedQuery.length - 1 && (
                    <h4 className="text-lg text-green-400 ">{queryStatus}</h4>
                  )}
                  <pre
                    className={`bg-gray-200 overflow-auto text-black p-2 text-3xl rounded ${
                    index === generatedQuery.length - 1 ? 'bg-green-200' : 'bg-red-200'
                    }`}
                  >
                    {query}
                  </pre>
                  </div>
                  ))}
                  </div>
                )}



                {queryResults?.length == 0 && showSkeleton && (
                   <>
                   <Skeleton className="h-12 w-full my-2" />
                   <Skeleton className="h-12 w-full my-2" />
                   
                   </>
                )}
                {queryResults?.length > 0 && (
                  <div className="border border-gray-300 rounded-lg p-4 shadow-md bg-gray-800 mt-6">
                    <h3 className="text-lg font-semibold mb-2">Query Results:</h3>
                    <ul>
                      {queryResults.map((row, index) => (
                        <li className="text-xl" key={index}>{JSON.stringify(row)}</li>
                      ))}
                    </ul>
                  </div>
                )}


{!naturalLanguageResponse && showSkeleton &&(
  <>
  <Skeleton className="h-12 w-full my-2" />
  <Skeleton className="h-12 w-full my-2" />
  
  </>
)}
{naturalLanguageResponse && (
  <div className="border border-gray-300 rounded-lg p-4 shadow-md bg-gray-800 mt-6">
    <h3 className="text-lg font-semibold mb-2 text-white">Natural Language Response</h3>
    <p className="text-white text-xl">
      {naturalLanguageResponse.split(/(\\.?\\*)/).map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={index}>{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
    </p>
  </div>
)}
              {chartData.length == 0 && visualLoading &&  (
                <>
                <Skeleton className="h-12 w-full my-2" />
                <Skeleton className="h-12 w-full my-2" />
                
                </>
              )}
                 {chartData.length > 0  && canVisualize && (
                  <div className="my-4 bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2 ">Visualization:</h3>

                    <Tabs value={activeChart} onValueChange={setActiveChart}>
                      <TabsList>
                        <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                        <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                      </TabsList>
                      <TabsContent value="bar">
                        <BarChart className="mt-4" width={600} height={300} data={chartData}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <CartesianGrid stroke="#f5f5f5" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </TabsContent>
                      <TabsContent value="pie">
                        <PieChart width={400} height={300}>
                          <Pie
                            data={chartData}
                            cx={200}
                            cy={150}
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend /> {/* Add a legend to the chart */}
                        </PieChart>
                      </TabsContent>
                    </Tabs>
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
