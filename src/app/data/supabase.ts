import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ubcgxlztfslyxrtercgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViY2d4bHp0ZnNseXhydGVyY2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDMwNDksImV4cCI6MjA4ODUxOTA0OX0.V3o3P4wA2Lndydxm4TLKNoutu___CphOEbvpM1liWcA'; // anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
