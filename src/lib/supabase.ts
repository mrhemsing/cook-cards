import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          ingredients: string;
          instructions: string;
          image_url: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          ingredients: string;
          instructions: string;
          image_url: string;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          ingredients?: string;
          instructions?: string;
          image_url?: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
