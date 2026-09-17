import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, teamId, studentId, mode } = body;

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // AI Project Assistant Mode (Ideation & Generator)
    if (mode === 'ideation') {
      const answers: Record<string, string> = {
        'problem_statement': `AI Suggested Problem Statement:\n"In modern urban and industrial environments, inefficient waste segregation leads to landfill contamination and high manual labor overheads. Existing manual sorting methods are error-prone and fail to separate recyclable materials effectively. This project proposes an automated waste classification system integrating Computer Vision (YOLOv8) and IoT actuators to classify waste streams in real-time."`,
        'objectives': `AI Suggested Key Objectives:\n1. Design a dual-tier conveyor mechanism with ultrasonic sensors for proximity detection.\n2. Train a lightweight Convolutional Neural Network (CNN) for real-time classification of plastic, paper, and metal.\n3. Develop a telemetry dashboard streaming daily sorting metrics and bin capacity alerts via MQTT.`,
        'methodology': `AI Suggested Methodology:\nPhase 1: Dataset collection and manual annotation of 1,500 campus waste images.\nPhase 2: Model training using PyTorch/YOLOv8 with transfer learning.\nPhase 3: Hardware deployment on Raspberry Pi 4 with servo-actuated diverter gates.\nPhase 4: Field testing under varying lighting conditions in cafeteria locations.`,
        'tech_stack': `AI Recommended Tech Stack:\n- Hardware: Raspberry Pi 4 (4GB), OpenCV Camera Module, Servo Motors, HC-SR04 Ultrasonic Sensors.\n- Software & ML: Python 3.10, PyTorch, YOLOv8, OpenCV, Flask REST API.\n- Frontend & IoT: Next.js Dashboard, Node-RED, MQTT Broker.`
      };

      const response = answers[question] || `AI Generated Recommendation:\nBased on your query regarding "${question}", we recommend adopting a modular architecture combining edge IoT microcontrollers with cloud analytics. Ensure you validate sensor calibration under extreme environmental conditions.`;

      return NextResponse.json({
        answer: response,
        isAiGenerated: true,
        source: 'PBL AI Assistant'
      });
    }

    // RAG Document Query Mode
    const teamSubmissions = store.getSubmissionsForTeam(teamId);

    if (teamSubmissions.length === 0) {
      return NextResponse.json({
        answer: 'I could not find any uploaded project documents belonging to your team. Please upload your project PDF/DOCX first to enable RAG Q&A.',
        sources: [],
        found: false
      });
    }

    // Retrieve authorized document context
    const docs = teamSubmissions.map(s => `[Document: ${s.fileName}, Version: ${s.version}]\n${s.aiSummary || 'Project document containing problem statement and implementation methodology.'}`).join('\n\n');

    // Simulate RAG answer citing authorized sources
    const ragAnswer = `Based on your authorized project document (${teamSubmissions[0].fileName}):\n\nThe project addresses real-time classification and system telemetry. Key components include automated sensors and machine learning inference. (Ref: ${teamSubmissions[0].fileName}, Section 3.2).`;

    return NextResponse.json({
      answer: ragAnswer,
      sources: teamSubmissions.map(s => ({ fileName: s.fileName, version: s.version })),
      found: true,
      isAiGenerated: true
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI processing failed' }, { status: 500 });
  }
}
