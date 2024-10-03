import React from 'react'
import ProtectedPage from './ClientSide'
import { createClient } from '@/utils/supabase/server'
import { Tables } from '@/types/supabase'

type Note = {
  id: number;
  title: string | null;
}

type Notes = Note[]

export default async function Page(){



  const supabase = createClient()
  const { data: notes } = await supabase.from('notes').select()
  const {
    data: { user },
  } = await supabase.auth.getUser();


  return (
    <ProtectedPage notes={notes ?? []} user={user} />
  )
}

