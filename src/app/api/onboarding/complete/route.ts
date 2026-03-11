// ============================================================
// POST /api/onboarding/complete
// Saves all onboarding data to the database
// ============================================================

import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { OnboardingData } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: OnboardingData = await request.json();

    // 1. Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        name: body.name,
        response_mode: body.response_mode,
        tone: body.tone,
        pushiness: body.pushiness,
        wake_time: body.wake_time,
        wind_down_time: body.wind_down_time,
        briefing_time: body.briefing_time,
        briefing_format: body.briefing_format,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Montreal',
        texts_access: body.texts_access,
        onboarding_completed: true,
        onboarding_step: 13,
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // 2. Save news preferences
    const { error: newsError } = await supabase
      .from('news_preferences')
      .upsert({
        user_id: user.id,
        enabled: body.news_enabled,
        tone: body.news_tone || 'balanced',
        outlets: body.news_outlets || [],
      });

    if (newsError) throw newsError;

    // 3. Create relationships from selected contacts
    if (body.contacts && body.contacts.length > 0) {
      const relationships = body.contacts.map(contact => ({
        user_id: user.id,
        person_name: contact.name,
        category: contact.category || 'friend',
        contact_frequency: contact.frequency || 'weekly',
      }));

      const { error: relError } = await supabase
        .from('relationships')
        .insert(relationships);

      if (relError) throw relError;
    }

    // 4. Create goal entries from selected categories
    if (body.goals && body.goals.length > 0) {
      const goalProjects = body.goals.map(goalCategory => ({
        user_id: user.id,
        name: categoryToProjectName(goalCategory),
        category: goalCategory as string,
        status: 'active' as const,
      }));

      const { data: projects, error: projError } = await supabase
        .from('projects')
        .insert(goalProjects)
        .select('id, category');

      if (projError) throw projError;

      // Create a goal for each project
      if (projects) {
        const goals = projects.map(project => ({
          user_id: user.id,
          project_id: project.id,
          title: categoryToGoalTitle(project.category),
          category: project.category,
          status: 'active' as const,
        }));

        const { error: goalError } = await supabase
          .from('goals')
          .insert(goals);

        if (goalError) throw goalError;
      }
    }

    // 5. Save AI tool connections
    if (body.ai_tools && body.ai_tools.length > 0) {
      const connections = body.ai_tools.map(tool => ({
        user_id: user.id,
        tool,
        is_active: true,
      }));

      const { error: aiError } = await supabase
        .from('ai_tool_connections')
        .insert(connections);

      if (aiError) throw aiError;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    );
  }
}

// ─── Helpers ───

function categoryToProjectName(category: string): string {
  const map: Record<string, string> = {
    fitness: 'Health & Fitness',
    language: 'Language Learning',
    career: 'Career Growth',
    finance: 'Financial Goals',
    social: 'Relationships & Social',
    creative: 'Creative Projects',
    organize: 'Life Organization',
    mindful: 'Mindfulness & Wellness',
  };
  return map[category] || 'General';
}

function categoryToGoalTitle(category: string): string {
  const map: Record<string, string> = {
    fitness: 'Improve health and fitness',
    language: 'Learn a new language',
    career: 'Advance my career',
    finance: 'Get better with finances',
    social: 'Stay connected with people I care about',
    creative: 'Complete a creative project',
    organize: 'Get my life more organized',
    mindful: 'Build a mindfulness practice',
  };
  return map[category] || 'Achieve my goal';
}
