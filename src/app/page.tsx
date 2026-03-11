import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check onboarding status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_completed) {
      redirect('/app');
    } else {
      redirect('/app/onboarding');
    }
  }

  redirect('/login');
}
