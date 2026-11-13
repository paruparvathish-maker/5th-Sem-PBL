import { NextResponse } from 'next/server';
import { fetchCloudTeams, fetchCloudSubmissions, storageStatus } from '@/lib/data/cloud-sync';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint: shows which shared store the deployment writes to and how
 * many records have already reached it. A `durable: false` result means writes
 * only live in one browser/lambda and cannot reach other devices.
 */
export async function GET() {
  const status = storageStatus();
  const [teams, submissions] = await Promise.all([
    fetchCloudTeams().catch(() => []),
    fetchCloudSubmissions().catch(() => []),
  ]);

  const submittedPapers = teams.filter((t: any) => t?.researchPaperProofName || t?.researchPaperProofPath);

  return NextResponse.json({
    ...status,
    counts: {
      teamsInSharedStore: teams.length,
      papersWithProof: submittedPapers.length,
      submissionsInSharedStore: submissions.length,
    },
    papers: submittedPapers.map((t: any) => ({
      teamId: t.id,
      semester: t.semester,
      section: t.section,
      teamNumber: t.teamNumber,
      status: t.researchPaperStatus,
      proofName: t.researchPaperProofName,
      updatedAt: t.researchPaperUpdatedAt,
    })),
  });
}
