import React from 'react';
import ProtectedPage from './ClientSide';
import { createClient } from '@/utils/supabase/server';
import { Tables } from '@/types/supabase';

type Note = {
  id: number;
  title: string | null;
};

type Notes = Note[];

export default async function Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tableNames, error: tableNamesError } = await supabase.rpc('get_all_table_names');

  if (tableNamesError) {
    console.error('Error fetching table names:', tableNamesError);
    return <div>Error fetching table names</div>; // Or handle the error as you prefer
  }

  const tableDataPromises = (tableNames || []).map(async (tableName: any) => {
    const { data, error } = await supabase.from(tableName).select();
    if (error) {
      console.error(`Error fetching data for ${tableName}:`, error);
      return [tableName, []]; // Return an empty array for the table in case of error
    }
    return [tableName, data];
  });

  const tableDataArray = await Promise.all(tableDataPromises);
  let tableData = Object.fromEntries(tableDataArray);

  // Set up Supabase subscriptions for real-time updates
  const updateChannel = supabase
    .channel('custom-update-channel')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'todos' },
      async (payload) => {
        // console.log('Change received!', payload);

        // Refetch data for the updated table
        const { data: updatedData, error: updatedError } = await supabase
          .from('todos')
          .select();

        if (updatedError) {
          console.error('Error fetching updated data:', updatedError);
        } else {
          // Update tableData with the new data for the 'todos' table
          tableData['todos'] = updatedData;
          console.log('Updated tableData:', tableData);
          // You might need to re-render the component here if it doesn't automatically update
          // For example, you could use a state variable and update it to trigger a re-render
        }
      }
    )
    .subscribe();

  const deleteChannel = supabase
    .channel('custom-delete-channel')
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'todos' },
      async (payload) => {
        console.log('Change received!', payload);

        // Refetch data for the updated table
        const { data: updatedData, error: updatedError } = await supabase
          .from('todos')
          .select();

        if (updatedError) {
          console.error('Error fetching updated data:', updatedError);
        } else {
          // Update tableData with the new data for the 'todos' table
          tableData['todos'] = updatedData;

          // You might need to re-render the component here if it doesn't automatically update
          // For example, you could use a state variable and update it to trigger a re-render
        }
      }
    )
    .subscribe();

  // Unsubscribe from channels when the component unmounts (if needed)
  // Note: This might not be necessary in a server component depending on your framework
  // If you're using a framework like Next.js, it might handle cleanup automatically
  // If you need manual cleanup, you can use a try...finally block or a similar mechanism
  // try {
  //   // ... your component logic ...
  // } finally {
  //   updateChannel.unsubscribe();
  //   deleteChannel.unsubscribe();
  // }

  return (
    <ProtectedPage tableData={tableData} tableNames={tableNames} user={user} />
  );
}
