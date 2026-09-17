import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submissionId } = body;

    const submission = store.getAllSubmissions().find(s => s.id === submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const aiFeedback = {
      summary: `Automated analysis for "${submission.fileName}": The document provides a multi-tier architectural overview of ${submission.projectTitle}. Key sections cover problem formulation, hardware schematic diagrams, sensor interfacing, and initial test bench benchmarks.`,
      missingSections: [
        'Detailed Hardware Component Cost Sheet & Vendor Matrix',
        'Fail-safe Redundancy & Power Backup Protocol'
      ],
      strengths: [
        'Rigorous problem formulation backed by recent journal citations',
        'Clear block diagrams illustrating sensor telemetry flow',
        'Comprehensive evaluation methodology with accuracy metrics'
      ],
      potentialIssues: [
        'Signal latency may increase under peak multi-client network load',
        'Ambient temperature variations could affect sensor calibration'
      ],
      suggestedImprovements: [
        'Include an explicit circuit schematic with pin assignments',
        'Add a comparative chart against existing baseline commercial systems'
      ],
      facultyQuestions: [
        'How did you determine the ultrasonic sensor sampling frequency of 50ms?',
        'What contingency is designed if the main microcontroller loses Wi-Fi connectivity?'
      ],
      isAdvisoryOnly: true,
      disclaimer: 'AI analysis is advisory only. Faculty remains solely responsible for official evaluation and marking.'
    };

    return NextResponse.json(aiFeedback);

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
