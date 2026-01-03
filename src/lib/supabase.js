import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CONNECTION
// ============================================================================
// Replace these with your Supabase project credentials
// Found in: Supabase Dashboard > Settings > API
// ============================================================================

const SUPABASE_URL = 'https://xuoqybqrfrjispdgjnca.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nF3BRNAXMXYS8M6Yy3jo0A_NYm1g9f0';  // The publishable key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;