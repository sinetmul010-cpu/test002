import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user has a profile and if they are the first user
      const adminClient = createAdminClient();
      const { count } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch user profile
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        // If this is the first user ever, grant admin and auto-approve
        const isFirst = (count || 0) === 0;
        await adminClient.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '',
          role: isFirst ? 'admin' : 'member',
          status: isFirst ? 'approved' : 'pending',
          pace: '5:30/km',
          crew_title: isFirst ? 'Crew Master (Admin)' : 'Runner',
        });
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/`);
}
