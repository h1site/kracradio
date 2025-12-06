import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Admin client with service role to access auth.users and bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify user is admin
async function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return null;
  }

  // Check if user is admin
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return null;
  }

  return user;
}

// GET - List all auth users
export async function GET(request) {
  try {
    const adminUser = await verifyAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all auth users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return simplified user data
    const simplifiedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.user_metadata?.username || u.email?.split('@')[0],
      created_at: u.created_at
    }));

    return NextResponse.json({ users: simplifiedUsers });
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add podcast uploader (upsert profile with admin privileges to bypass RLS)
export async function POST(request) {
  try {
    const adminUser = await verifyAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, email, folder } = await request.json();

    if (!userId || !folder) {
      return NextResponse.json({ error: 'userId and folder are required' }, { status: 400 });
    }

    // Upsert profile with podcast upload permissions using admin client (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        podcast_upload_enabled: true,
        podcast_upload_folder: folder.trim()
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in add podcast uploader API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
