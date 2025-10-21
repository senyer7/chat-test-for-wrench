import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ihsddqliforaoxzcuuwx.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2RkcWxpZm9yYW94emN1dXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDA5NjAsImV4cCI6MjA3MTc3Njk2MH0.Mtzvijp37OP-zNt6TJEFT8ua6_o4slr3c8m1B3vhNfA";

export const supabase = createClient(supabaseUrl, supabaseKey);

// "CRUD"
