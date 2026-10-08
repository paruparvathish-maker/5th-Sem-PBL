import { prisma } from './client';
import { RAW_PDF_SEED, getGuideEmail, getGuidePhone } from '../data/seed-dataset';
import { RAW_4TH_SEM_SEED } from '../data/seed-dataset-4th';

export async function seedPrismaDatabase() {
  const userCount = await prisma.userProfile.count();
  if (userCount > 0) {
    console.log('Database already populated with Prisma.');
    return;
  }

  console.log('Seeding SQLite database via Prisma...');

  // Create Admin
  const admin = await prisma.userProfile.create({
    data: {
      id: '180881',
      email: 'paruparvathish@gmail.com',
      name: 'Parvathisha P (Admin)',
      role: 'admin',
      password: '03May@2002@',
      isFirstLogin: false,
    },
  });

  const facultyMap = new Map<string, string>();

  // 1. Seed 5th Semester Teams
  for (const seedTeam of RAW_PDF_SEED) {
    const guideEmail = getGuideEmail(seedTeam.guideName);
    const guidePhone = getGuidePhone(seedTeam.guideName);

    if (!facultyMap.has(guideEmail)) {
      let fac = await prisma.userProfile.findUnique({ where: { email: guideEmail } });
      if (!fac) {
        fac = await prisma.userProfile.create({
          data: {
            id: `fac-${facultyMap.size + 1}`,
            email: guideEmail,
            name: seedTeam.guideName,
            role: 'faculty',
            phone: guidePhone,
            staffCode: `F${1000 + facultyMap.size + 1}`,
            isFirstLogin: true,
          },
        });
      }
      facultyMap.set(guideEmail, fac.id);
    }
    const guideId = facultyMap.get(guideEmail)!;

    const teamId = `team-5-${seedTeam.section}-${seedTeam.teamNumber}`;

    const team = await prisma.team.create({
      data: {
        id: teamId,
        teamNumber: seedTeam.teamNumber,
        section: seedTeam.section,
        semester: 5,
        projectTitle: seedTeam.projectTitle,
        projectDescription: seedTeam.projectDescription,
        guideId,
        guideName: seedTeam.guideName,
        guideEmail,
      },
    });

    for (const s of seedTeam.students) {
      const cleanUsn = s.usn.toUpperCase().trim();
      let stud = await prisma.userProfile.findUnique({ where: { usn: cleanUsn } });
      if (!stud) {
        stud = await prisma.userProfile.create({
          data: {
            id: `stud-${cleanUsn}`,
            email: `${cleanUsn.toLowerCase()}@student.dsatm.edu.in`,
            name: s.name,
            usn: cleanUsn,
            role: 'student',
            section: seedTeam.section,
            isFirstLogin: true,
          },
        });
      }

      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: stud.id,
        },
      });
    }
  }

  // 2. Seed 4th Semester Teams
  for (const seedTeam of RAW_4TH_SEM_SEED) {
    const guideEmail = getGuideEmail(seedTeam.guideName);
    const guidePhone = getGuidePhone(seedTeam.guideName);

    if (!facultyMap.has(guideEmail)) {
      let fac = await prisma.userProfile.findUnique({ where: { email: guideEmail } });
      if (!fac) {
        fac = await prisma.userProfile.create({
          data: {
            id: `fac-${facultyMap.size + 1}`,
            email: guideEmail,
            name: seedTeam.guideName,
            role: 'faculty',
            phone: guidePhone,
            staffCode: `F${1000 + facultyMap.size + 1}`,
            isFirstLogin: true,
          },
        });
      }
      facultyMap.set(guideEmail, fac.id);
    }
    const guideId = facultyMap.get(guideEmail)!;

    const teamId = `team-4-${seedTeam.section}-${seedTeam.teamNumber}`;

    const team = await prisma.team.create({
      data: {
        id: teamId,
        teamNumber: seedTeam.teamNumber,
        section: seedTeam.section,
        semester: 4,
        projectTitle: `4th Sem Research Paper (${seedTeam.teamNumber})`,
        projectDescription: `Research paper work under ${seedTeam.guideName}`,
        guideId,
        guideName: seedTeam.guideName,
        guideEmail,
        researchPaperStatus: 'submitted',
      },
    });

    for (const s of seedTeam.students) {
      const cleanUsn = s.usn.toUpperCase().trim();
      let stud = await prisma.userProfile.findUnique({ where: { usn: cleanUsn } });
      if (!stud) {
        stud = await prisma.userProfile.create({
          data: {
            id: `stud-${cleanUsn}`,
            email: `${cleanUsn.toLowerCase()}@student.dsatm.edu.in`,
            name: s.name,
            usn: cleanUsn,
            role: 'student',
            section: seedTeam.section,
            isFirstLogin: true,
          },
        });
      }

      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: stud.id,
        },
      });
    }
  }

  // 3. Seed Deadlines
  await prisma.deadline.createMany({
    data: [
      {
        id: 'dl-project-stmt',
        title: 'Problem Statement & Description',
        description: 'Submit your finalized project title and detailed problem description.',
        deadlineType: 'submission',
        dueDate: new Date('2026-09-22T17:00:00'),
        applicableSections: JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F']),
        submissionRequired: true,
        status: 'open',
        createdBy: admin.id,
      },
      {
        id: 'dl-guide-meeting',
        title: '1st Guide Meeting Document',
        description: 'Upload the signed document from your first guide meeting (PDF/DOCX).',
        deadlineType: 'submission',
        dueDate: new Date('2026-09-29T17:00:00'),
        applicableSections: JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F']),
        submissionRequired: true,
        status: 'open',
        createdBy: admin.id,
      },
    ],
  });

  console.log('Prisma SQLite seeding completed.');
}
