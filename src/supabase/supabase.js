import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://qxxojctvzcvnqeaxevdw.supabase.co";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eG9qY3R2emN2bnFlYXhldmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0Mjg2OTQsImV4cCI6MjEwMzAwNDY5NH0.zlodfz7yuNLF5eQKXA_9sRfrOiOWcbsQvwysMua0RIk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;