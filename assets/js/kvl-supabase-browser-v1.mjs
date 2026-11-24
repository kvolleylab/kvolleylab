import {createClient} from '../vendor/supabase-js-2.84.0.mjs';

const SUPABASE_URL='https://byaukvbwdhextiqycrds.supabase.co';
const SUPABASE_KEY='sb_publishable_DKeCLeLwQ3xEpgsRzbU7qA_oFKjc6HM';
const CLIENT_KEY=Symbol.for('kvl.supabase.browser.client.v1');

function build(){
  return createClient(SUPABASE_URL,SUPABASE_KEY,{
    auth:{
      persistSession:true,
      autoRefreshToken:true,
      detectSessionInUrl:true
    }
  });
}

const root=globalThis;
if(!root[CLIENT_KEY])root[CLIENT_KEY]=build();

export const supabase=root[CLIENT_KEY];
export const KVL_SUPABASE_URL=SUPABASE_URL;
