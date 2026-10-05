import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Assuming RAW_PDF_SEED is exported or we can just import it
import { RAW_PDF_SEED, getGuideEmail, getGuidePhone } from '../src/lib/data/seed-dataset';

// 1. Setup Supabase Client (Requires Service Role Key for Auth Admin API)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log("Starting Supabase Seeding...");

  // We need to keep track of created faculty and students to get their UUIDs
  const facultyMap = new Map<string, any>(); 
  const studentMap = new Map<string, any>();
  const teamMap = new Map<string, string>(); // teamNumber -> team UUID

  try {
    // 1. Create Admin User
    const adminEmail = 'paruparvathish@gmail.com';
    let { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: '03May@2002@',
      email_confirm: true
    });
    
    // If user exists, we might need to fetch them, but for seed we assume fresh DB
    if (adminErr && !adminErr.message.includes('already registered')) {
        console.error("Failed to create admin auth user:", adminErr);
    }
    
    let adminId = adminAuth?.user?.id;
    if (!adminId) {
        // fetch existing
        const { data: { users } } = await supabase.auth.admin.listUsers();
        adminId = users.find(u => u.email === adminEmail)?.id;
    }

    if (adminId) {
      await supabase.from('profiles').upsert({
        id: adminId,
        email: adminEmail,
        name: 'Parvathisha P (Admin)',
        role: 'admin',
        is_first_login: false
      });
      console.log("Admin user seeded:", adminId);
    }

    // 2. Iterate through RAW_PDF_SEED to collect faculty and students
    for (const seedTeam of RAW_PDF_SEED) {
      const guideEmail = getGuideEmail(seedTeam.guideName);
      
      // Provision Faculty
      if (!facultyMap.has(guideEmail)) {
        let { data: facAuth, error: facErr } = await supabase.auth.admin.createUser({
          email: guideEmail,
          password: getGuidePhone(seedTeam.guideName), // default password
          email_confirm: true
        });

        let facId = facAuth?.user?.id;
        if (!facId) {
            const { data: { users } } = await supabase.auth.admin.listUsers();
            facId = users.find(u => u.email === guideEmail)?.id;
        }

        if (facId) {
            await supabase.from('profiles').upsert({
                id: facId,
                email: guideEmail,
                name: seedTeam.guideName,
                role: 'faculty',
                phone: getGuidePhone(seedTeam.guideName),
                is_first_login: true
            });
            facultyMap.set(guideEmail, facId);
        }
      }

      // Provision Students
      for (const student of seedTeam.students) {
        const cleanUsn = student.usn.toUpperCase().trim();
        const studentEmail = `${cleanUsn.toLowerCase()}@student.dsatm.edu.in`;
        
        if (!studentMap.has(cleanUsn)) {
            let { data: stuAuth, error: stuErr } = await supabase.auth.admin.createUser({
                email: studentEmail,
                password: cleanUsn, // default password
                email_confirm: true
            });

            let stuId = stuAuth?.user?.id;
            if (!stuId) {
                const { data: { users } } = await supabase.auth.admin.listUsers();
                stuId = users.find(u => u.email === studentEmail)?.id;
            }

            if (stuId) {
                await supabase.from('profiles').upsert({
                    id: stuId,
                    email: studentEmail,
                    name: student.name,
                    usn: cleanUsn,
                    role: 'student',
                    section: seedTeam.section,
                    is_first_login: true
                });
                studentMap.set(cleanUsn, stuId);
            }
        }
      }

      // Provision Team
      const facId = facultyMap.get(guideEmail);
      if (facId) {
          const { data: teamData, error: teamErr } = await supabase.from('teams').upsert({
              team_number: seedTeam.teamNumber,
              section: seedTeam.section,
              project_title: seedTeam.projectTitle,
              project_description: seedTeam.projectDescription,
              guide_id: facId
          }).select('id').single();

          if (teamData) {
              teamMap.set(seedTeam.teamNumber, teamData.id);

              // Provision Team Members
              for (const student of seedTeam.students) {
                  const cleanUsn = student.usn.toUpperCase().trim();
                  const stuId = studentMap.get(cleanUsn);
                  if (stuId) {
                      await supabase.from('team_members').upsert({
                          team_id: teamData.id,
                          student_id: stuId
                      });
                  }
              }
          } else {
              console.error("Failed to create team:", seedTeam.teamNumber, teamErr);
          }
      }
    }
    
    console.log("Successfully seeded users and teams.");

  } catch (err) {
    console.error("Seeding error:", err);
  }
}

seedDatabase();
