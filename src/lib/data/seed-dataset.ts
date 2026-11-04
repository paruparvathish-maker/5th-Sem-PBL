import { UserProfile, Team, Deadline, GuideMeeting, Evaluation, Submission, NotificationItem } from '../types/pbl';

export interface RawTeamSeed {
  teamNumber: string;
  section: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  guideName: string;
  projectTitle: string;
  projectDescription: string;
  students: { usn: string; name: string }[];
}

const DEFAULT_TITLE = 'To Be Decided (TBD)';
const DEFAULT_DESC = 'Project topic and description to be finalized by team members and assigned guide.';

export const RAW_PDF_SEED: RawTeamSeed[] = [
  // SECTION A
  {
    teamNumber: 'A1',
    section: 'A',
    guideName: 'Mrs. Deepthi R',
    projectTitle: "VisionEdge: An Open Benchmark Suite for Mobile Vision Inference",
    projectDescription: "5th Semester PBL Project: VisionEdge: An Open Benchmark Suite for Mobile Vision Inference",
    students: [
      { usn: '1DT24CS010', name: 'ACHUT MALLIKARJUN SULIKERI' },
      { usn: '1DT24CS018', name: 'AKSHAY V B' },
      { usn: '1DT24CS036', name: 'ARJUN M KASHYAP' },
      { usn: '1DT24CS052', name: 'BHAGAT K S' },
    ]
  },
  {
    teamNumber: 'A2',
    section: 'A',
    guideName: 'Dr. Guruprasad B J',
    projectTitle: "Ballad: A Deterministic Geometry Engine for Deconstruction Diagrams of Design Process",
    projectDescription: "5th Semester PBL Project: Ballad: A Deterministic Geometry Engine for Deconstruction Diagrams of Design Process",
    students: [
      { usn: '1DT24CS011', name: 'Aditya Adkoli' },
      { usn: '1DT24CS028', name: 'Anuj Dhavale' },
      { usn: '1DT24CS055', name: 'Bhargava Krishna M R' },
    ]
  },
  {
    teamNumber: 'A3',
    section: 'A',
    guideName: 'Dr. Shiva Sumanth Reddy',
    projectTitle: "Shiori : AI Based Cognitive Gaming and memory assistance Platform for Elderly Dementia Patient across India",
    projectDescription: "5th Semester PBL Project: Shiori : AI Based Cognitive Gaming and memory assistance Platform for Elderly Dementia Patient across India",
    students: [
      { usn: '1DT24CS022', name: 'Anirudh Aarya G R' },
      { usn: '1DT24CS030', name: 'Anushka Raj' },
      { usn: '1DT24CS033', name: 'Appireddy Sohini' },
      { usn: '1DT24CS045', name: 'Aryan Yadav' },
    ]
  },
  {
    teamNumber: 'A4',
    section: 'A',
    guideName: 'Dr. C Nandini',
    projectTitle: "Aegis Hazmat — 3D AI Platform for Hazardous Inspection",
    projectDescription: "5th Semester PBL Project: Aegis Hazmat — 3D AI Platform for Hazardous Inspection",
    students: [
      { usn: '1DT24CS039', name: 'Arsh Saxena' },
      { usn: '1DT24CS043', name: 'Arvin Vijay M Moodbagilu' },
      { usn: '1DT24CS007', name: 'Abhishek K Basarihallimatha' },
      { usn: '1DT24CS016', name: 'Ajay Raghav S P' },
    ]
  },
  {
    teamNumber: 'A5',
    section: 'A',
    guideName: 'Dr. Muzameel Ahmed',
    projectTitle: "NetTrace – Find where an Internet outage is actually happening",
    projectDescription: "5th Semester PBL Project: NetTrace – Find where an Internet outage is actually happening",
    students: [
      { usn: '1DT24CS004', name: 'Abhijith DB' },
      { usn: '1DT24CS031', name: 'Anvith J' },
      { usn: '1DT24CS032', name: 'Apeksh A' },
      { usn: '1DT24CS044', name: 'Arya K G' },
    ]
  },
  {
    teamNumber: 'A6',
    section: 'A',
    guideName: 'Dr. Shivanna K',
    projectTitle: "GeoSense: AI-Powered Landslide Prediction and Management System",
    projectDescription: "5th Semester PBL Project: GeoSense: AI-Powered Landslide Prediction and Management System",
    students: [
      { usn: '1DT24CS001', name: 'A JATIN RAM CHOWDARY' },
      { usn: '1DT24CS020', name: 'AMOGH S Y' },
      { usn: '1DT24CS042', name: 'ARVADIYA OM DINESH' },
      { usn: '1DT24CS054', name: 'BHARGAV GP' },
    ]
  },
  {
    teamNumber: 'A7',
    section: 'A',
    guideName: 'Mr. Gajendra L',
    projectTitle: "SafeSphere: A safer space, built with trust.",
    projectDescription: "5th Semester PBL Project: SafeSphere: A safer space, built with trust.",
    students: [
      { usn: '1DT24CS013', name: 'Agarbattiwala Jaweriya Anis shariff' },
      { usn: '1DT24CS014', name: 'Aishwarya Aiyandra Sujith' },
      { usn: '1DT24CS029', name: 'Anushka Ankush Mette' },
      { usn: '1DT24CS046', name: 'Arzoo Shaikh' },
    ]
  },
  {
    teamNumber: 'A8',
    section: 'A',
    guideName: 'Mrs. Shilpa M',
    projectTitle: "Xeno",
    projectDescription: "5th Semester PBL Project: Xeno",
    students: [
      { usn: '1DT24CS006', name: 'Abhineet Kumar' },
      { usn: '1DT24CS027', name: 'Anmol Singh' },
      { usn: '1DT24CS050', name: 'Ayushman Mohapatra' },
      { usn: '1DT24CS026', name: 'Ankush Kumar' },
    ]
  },
  {
    teamNumber: 'A9',
    section: 'A',
    guideName: 'Ms. Vijaylaxmi Inamdar',
    projectTitle: "Explainable Longitudinal AI for Dynamic Maternal Health Risk Prediction with Regional Language Support",
    projectDescription: "5th Semester PBL Project: Explainable Longitudinal AI for Dynamic Maternal Health Risk Prediction with Regional Language Support",
    students: [
      { usn: '1DT24CS008', name: 'Abhishek V Hosatti' },
      { usn: '1DT24CS009', name: 'Abhyudaya s' },
      { usn: '1DT24CS049', name: 'Ayush D Gowda' },
      { usn: '1DT25CS406', name: 'Ananya S' },
    ]
  },
  {
    teamNumber: 'A10',
    section: 'A',
    guideName: 'Mr. Shreenidhi.B.S',
    projectTitle: "A gamified reminder app",
    projectDescription: "5th Semester PBL Project: A gamified reminder app",
    students: [
      { usn: '1DT24CS019', name: 'Albie Augustine' },
      { usn: '1DT24CS025', name: 'Ankit Upadhyaay' },
      { usn: '1DT24CS047', name: 'Atla Siva Ganesh Reddy' },
      { usn: '1DT24CS048', name: 'Atul Kumar' },
    ]
  },
  {
    teamNumber: 'A11',
    section: 'A',
    guideName: 'Mrs. Manasa Sandeep',
    projectTitle: "BuildSight AI – LiDAR-Based Intelligent Building Inspection & Digital Twin",
    projectDescription: "5th Semester PBL Project: BuildSight AI – LiDAR-Based Intelligent Building Inspection & Digital Twin",
    students: [
      { usn: '1DT24CS021', name: 'Anagha K' },
      { usn: '1DT24CS035', name: 'Arjumand ZD' },
      { usn: '1DT24CS041', name: 'Aruna K' },
      { usn: '1DT24CS056', name: 'Bhoomika RS' },
    ]
  },
  {
    teamNumber: 'A12',
    section: 'A',
    guideName: 'Mrs. Arpitha Vasudev',
    projectTitle: "AI- Based API Security Intelligence Platform",
    projectDescription: "5th Semester PBL Project: AI- Based API Security Intelligence Platform",
    students: [
      { usn: '1DT25CS403', name: 'Akash D' },
      { usn: '1DT25CS405', name: 'Anand H' },
      { usn: '1DT24CS053', name: 'Bhagyeshree' },
      { usn: '1DT24CS034', name: 'ARCHANA M' },
    ]
  },
  {
    teamNumber: 'A13',
    section: 'A',
    guideName: 'Ms. Nethra H L',
    projectTitle: "GovFlow AI: Predictive Queue Intelligence for Smarter Public Service Management",
    projectDescription: "5th Semester PBL Project: GovFlow AI: Predictive Queue Intelligence for Smarter Public Service Management",
    students: [
      { usn: '1DT25CS408', name: 'Archana V' },
      { usn: '1DT24CS037', name: 'Arpita H P' },
      { usn: '1DT24CS040', name: 'Arun R' },
      { usn: '1DT24CS410', name: 'Bharat V Balaraddi' },
    ]
  },
  {
    teamNumber: 'A14',
    section: 'A',
    guideName: 'Mrs. Yamini',
    projectTitle: "AI-Based Infrastructure Incident Correlation and Root-Cause Detection System",
    projectDescription: "5th Semester PBL Project: AI-Based Infrastructure Incident Correlation and Root-Cause Detection System",
    students: [
      { usn: '1DT24CS015', name: 'Aishwarya R' },
      { usn: '1DT24CS023', name: 'Anjali K S' },
      { usn: '1DT24CS024', name: 'Anjana M N' },
      { usn: '1DT24CS038', name: 'Arpitha H M' },
    ]
  },
  {
    teamNumber: 'A15',
    section: 'A',
    guideName: 'Mrs. Bhavya V',
    projectTitle: "To Be Decided (TBD)",
    projectDescription: "Project topic and description to be finalized by team members and assigned guide.",
    students: [
      { usn: '1DT24CS005', name: 'Abhilaksh' },
      { usn: '1DT25CS402', name: 'Akanksha B' },
      { usn: '1DT25CS404', name: 'Amisha chona' },
      { usn: '1DT25CS407', name: 'Anupriya' },
    ]
  },
  {
    teamNumber: 'A16',
    section: 'A',
    guideName: 'Ms. Meghana Nigam',
    projectTitle: "To Be Decided (TBD)",
    projectDescription: "Project topic and description to be finalized by team members and assigned guide.",
    students: [
      { usn: '1DT24CS051', name: 'B Raghavendra Kumar' },
      { usn: '1DT24CS012', name: 'Aditya reddy M' },
      { usn: '1DT25CS401', name: 'Adarsh G' },
    ]
  },
  {
    teamNumber: 'A17',
    section: 'A',
    guideName: 'Mr. Nunna Rama Chandu',
    projectTitle: "Product Department App",
    projectDescription: "5th Semester PBL Project: Product Department App",
    students: [
      { usn: '1DT24CS002', name: 'A SUSHANTH' },
      { usn: '1DT24CS003', name: 'AAMIRA BUSHRA MUKTI' },
      { usn: '1DT24CS017', name: 'AKASH' },
      { usn: '1DT25CS400', name: 'A Nagaraja' },
    ]
  },

  // SECTION B
  {
    teamNumber: 'B1',
    section: 'B',
    guideName: 'Mrs. Megha D',
    projectTitle: "Spatial Audio-Acoustic Impulse Response as Input Modality in Mobile Pervasive Games",
    projectDescription: "5th Semester PBL Project: Spatial Audio-Acoustic Impulse Response as Input Modality in Mobile Pervasive Games",
    students: [
      { usn: '1DT24CS064', name: 'Danush Venkat N H' },
      { usn: '1DT24CS058', name: 'Bhuvan S' },
      { usn: '1DT24CS093', name: 'Gana C Shekhar' },
      { usn: '1DT24CS067', name: 'Deeksha L Hegde' },
    ]
  },
  {
    teamNumber: 'B2',
    section: 'B',
    guideName: 'Dr. Shalini S',
    projectTitle: "Intelligent Fraud Monitoring for the Public Distribution System",
    projectDescription: "5th Semester PBL Project: Intelligent Fraud Monitoring for the Public Distribution System",
    students: [
      { usn: '1DT25CS411', name: 'Bhoomika R' },
      { usn: '1DT25CS414', name: 'Chitra N' },
      { usn: '1DT25CS416', name: 'Deepthi T' },
      { usn: '1DT24CS071', name: 'Deepika B' },
    ]
  },
  {
    teamNumber: 'B3',
    section: 'B',
    guideName: 'Ms. Asha Latha',
    projectTitle: "AI-Based Food Resource Management System with Predictive Waste Analytics for Sustainable Household Consumption",
    projectDescription: "5th Semester PBL Project: AI-Based Food Resource Management System with Predictive Waste Analytics for Sustainable Household Consumption",
    students: [
      { usn: '1DT24CS084', name: 'DIYA UMESH' },
      { usn: '1DT24CS090', name: 'G CHARUHAASINI' },
      { usn: '1DT24CS112', name: 'JERUSHA ABRAHAM' },
      { usn: '1DT24CS114', name: 'K HRISHITA' },
    ]
  },
  {
    teamNumber: 'B4',
    section: 'B',
    guideName: 'Mrs. Apoorva Busad',
    projectTitle: "AgentShield: An Intent-Aware Runtime Authorization and Security Framework for Autonomous AI Agents",
    projectDescription: "5th Semester PBL Project: AgentShield: An Intent-Aware Runtime Authorization and Security Framework for Autonomous AI Agents",
    students: [
      { usn: '1DT25CS415', name: 'Darshan K M' },
      { usn: '1DT25CS417', name: 'Dhanush S' },
      { usn: '1DT25CS420', name: 'Doddabasavaraja A' },
      { usn: '1DT25CS423', name: 'Ujjwal G S' },
    ]
  },
  {
    teamNumber: 'B5',
    section: 'B',
    guideName: 'Mrs. kavyashree L',
    projectTitle: "FileLens — content-aware file analysis",
    projectDescription: "5th Semester PBL Project: FileLens — content-aware file analysis",
    students: [
      { usn: '1DT24CS085', name: 'Drishya Shetti' },
      { usn: '1DT24CS103', name: 'Hosur Harshitha' },
      { usn: '1DT24CS107', name: 'Ishita Dharmawat' },
      { usn: '1DT24CS110', name: 'Jayanth K' },
    ]
  },
  {
    teamNumber: 'B6',
    section: 'B',
    guideName: 'Mr. Parvathisha P',
    projectTitle: "EchoGuard — Ambient Distress Sensing & Proximity Mesh Response System",
    projectDescription: "5th Semester PBL Project: EchoGuard — Ambient Distress Sensing & Proximity Mesh Response System",
    students: [
      { usn: '1DT24CS073', name: 'Deepthi R' },
      { usn: '1DT24CS062', name: 'Chidanand T M' },
      { usn: '1DT24CS106', name: 'Inchara K' },
      { usn: '1DT24CS096', name: 'Gowravi Harish' },
    ]
  },
  {
    teamNumber: 'B7',
    section: 'B',
    guideName: 'Mr. Rahul Samanta',
    projectTitle: "Offline-First ML Framework for Second-Life EV Battery Passport in Informat Economics",
    projectDescription: "5th Semester PBL Project: Offline-First ML Framework for Second-Life EV Battery Passport in Informat Economics",
    students: [
      { usn: '1DT24CS113', name: 'Junaid Khan' },
      { usn: '1DT25CS108', name: 'J M Varun' },
      { usn: '1DT24CS076', name: 'Dhanush B' },
      { usn: '1DT25CS422', name: 'Farman Ul Haq' },
    ]
  },
  {
    teamNumber: 'B8',
    section: 'B',
    guideName: 'Ms. Meghana Nigam',
    projectTitle: "Roadnova - A Smart Roadtrip Planner",
    projectDescription: "5th Semester PBL Project: Roadnova - A Smart Roadtrip Planner",
    students: [
      { usn: '1DT24CS057', name: 'Bhutada Richa Sujan' },
      { usn: '1DT24CS070', name: 'Deepankar Anand' },
      { usn: '1DT24CS072', name: 'Deepshika Reddy' },
      { usn: '1DT24CS088', name: 'Fahad Ahmed' },
    ]
  },
  {
    teamNumber: 'B9',
    section: 'B',
    guideName: 'Mr. Rahul Maity',
    projectTitle: "AgriVision- AI Powered crop disease detection smart farm monitoring and direct to market losgistics",
    projectDescription: "5th Semester PBL Project: AgriVision- AI Powered crop disease detection smart farm monitoring and direct to market losgistics",
    students: [
      { usn: '1DT24CS068', name: 'Deeksha M Ramesh' },
      { usn: '1DT24CS078', name: 'Dhruthi E' },
    ]
  },
  {
    teamNumber: 'B10',
    section: 'B',
    guideName: 'Mr. Chandrashekar G',
    projectTitle: "GrainGuard – Smart Grain Storage Monitoring System",
    projectDescription: "5th Semester PBL Project: GrainGuard – Smart Grain Storage Monitoring System",
    students: [
      { usn: '1DT24CS074', name: 'Deepthi Reddy' },
      { usn: '1DT24CS075', name: 'Devika R' },
      { usn: '1DT24CS095', name: 'Gouri Tuppad' },
      { usn: '1DT24CS099', name: 'Harshitha D' },
    ]
  },
  {
    teamNumber: 'B11',
    section: 'B',
    guideName: 'Ms. Priya G',
    projectTitle: "Privacy guard: An On-Device Privacy Scanner for AI Sharing",
    projectDescription: "5th Semester PBL Project: Privacy guard: An On-Device Privacy Scanner for AI Sharing",
    students: [
      { usn: '1DT24CS059', name: 'Vasanth Kumar' },
      { usn: '1DT24CS079', name: 'Diganth H Rao' },
      { usn: '1DT24CS104', name: 'Hrishikesh Maruthi' },
      { usn: '1DT24CS083', name: 'Divit Krishna' },
    ]
  },
  {
    teamNumber: 'B12',
    section: 'B',
    guideName: 'Mr. Orchu Venkata Koteswararao',
    projectTitle: "OmniFlow: An Uncertainty-Governed Autonomous Agent for Cross-Channel Administrative Automation",
    projectDescription: "5th Semester PBL Project: OmniFlow: An Uncertainty-Governed Autonomous Agent for Cross-Channel Administrative Automation",
    students: [
      { usn: '1DT24CS102', name: 'Honmayee SP' },
      { usn: '1DT24CS094', name: 'Gnanitha P' },
      { usn: '1DT24CS105', name: 'Inarah shariff' },
      { usn: '1DT24CS063', name: 'chanjeev Singh' },
    ]
  },
  {
    teamNumber: 'B13',
    section: 'B',
    guideName: 'Mrs. Dasari Bhulakshmi',
    projectTitle: "Offline AI-Based Predictive Network Copilot for Intelligent MPLS Network Monitoring",
    projectDescription: "5th Semester PBL Project: Offline AI-Based Predictive Network Copilot for Intelligent MPLS Network Monitoring",
    students: [
      { usn: '1DT24CS082', name: 'Disha S' },
      { usn: '1DT24CS100', name: 'Harshitha M' },
      { usn: '1DT24CS101', name: 'Hemashree S M' },
      { usn: '1DT25CS419', name: 'Disha Y C' },
    ]
  },
  {
    teamNumber: 'B14',
    section: 'B',
    guideName: 'Mr. Keerthana Sankar',
    projectTitle: "TROTL – A Social and Intelligent Adventure Platform for Motorcycle Riders",
    projectDescription: "5th Semester PBL Project: TROTL – A Social and Intelligent Adventure Platform for Motorcycle Riders",
    students: [
      { usn: '1DT24CS077', name: 'Dhanush R' },
      { usn: '1DT24CS080', name: 'Dilip L' },
      { usn: '1DT24CS091', name: 'Gagan Gowda M R' },
      { usn: '1DT24CS109', name: 'Jagadish B' },
    ]
  },
  {
    teamNumber: 'B15',
    section: 'B',
    guideName: 'Mr. Nunna Rama Chandu',
    projectTitle: "SentinelCampus-X",
    projectDescription: "5th Semester PBL Project: SentinelCampus-X",
    students: [
      { usn: '1DT24CS098', name: 'HS Shreesha' },
      { usn: '1DT24CS087', name: 'ERANNA GIDANI' },
      { usn: '1DT24CS061', name: 'Chetan M Reddy' },
    ]
  },
  {
    teamNumber: 'B16',
    section: 'B',
    guideName: 'Mrs. Lavanya K',
    projectTitle: "Smart Construction Material Inventory and Daily Usage Management System",
    projectDescription: "5th Semester PBL Project: Smart Construction Material Inventory and Daily Usage Management System",
    students: [
      { usn: '1DT24CS069', name: 'Deekshith B M' },
      { usn: '1DT25CS427', name: 'Jayanth K S' },
      { usn: '1DT25CS418', name: 'Dinesh S' },
    ]
  },
  {
    teamNumber: 'B17',
    section: 'B',
    guideName: 'Mr. Chandrashekar G',
    projectTitle: "savexa",
    projectDescription: "5th Semester PBL Project: savexa",
    students: [
      { usn: '1DT24CS066', name: 'Deeksha k s' },
      { usn: '1DT24CS089', name: 'G Amulya' },
      { usn: '1DT24CS111', name: 'Jayanth S' },
      { usn: '1DT24CS081', name: 'Dipesh Singh' },
    ]
  },
  {
    teamNumber: 'B18',
    section: 'B',
    guideName: 'Dr. Usha K C',
    projectTitle: "EndoSense-AI",
    projectDescription: "5th Semester PBL Project: EndoSense-AI",
    students: [
      { usn: '1DT24CS060', name: 'Chandana' },
      { usn: '1DT24CS065', name: 'Darshini C' },
      { usn: '1DT24CS086', name: 'Drushya SK' },
      { usn: '1DT24CS092', name: 'Gagana' },
    ]
  },

  // SECTION C
  {
    teamNumber: 'C1',
    section: 'C',
    guideName: 'Dr. Seema J K',
    projectTitle: "Agricultural based Drone(IOT)",
    projectDescription: "5th Semester PBL Project: Agricultural based Drone(IOT)",
    students: [
      { usn: '1DT24CS121', name: 'Keerthan B.G' },
      { usn: '1DT25CS426', name: 'H K Gagan' },
      { usn: '1DT25CS470', name: 'K Vinay Kumar' },
    ]
  },
  {
    teamNumber: 'C2',
    section: 'C',
    guideName: 'Ms. Kuheli Manna',
    projectTitle: "CyberShield AI: An On-Device Explainable AI Framework for Real-Time Mobile Scam Prevention and Risk Assessment.",
    projectDescription: "5th Semester PBL Project: CyberShield AI: An On-Device Explainable AI Framework for Real-Time Mobile Scam Prevention and Risk Assessment.",
    students: [
      { usn: '1DT24CS139', name: 'MALLIKARJUN' },
      { usn: '1DT24CS142', name: 'MANJUNATH MARUTI NAIK' },
      { usn: '1DT24CS135', name: 'MEGHANAT' },
      { usn: '1DT24CS141', name: 'MANJUNATHGOWDA.Y' },
    ]
  },
  {
    teamNumber: 'C3',
    section: 'C',
    guideName: 'Mr. Kondeti Dilip Kumar',
    projectTitle: "crop shield— AI-Powered Crop Health Assistant",
    projectDescription: "5th Semester PBL Project: crop shield— AI-Powered Crop Health Assistant",
    students: [
      { usn: '1DT24CS162', name: 'M.Prathyuush Raj' },
      { usn: '1DT24CS145', name: 'M JAGAN MOHAN CHOWDARY' },
      { usn: '1DT24CS154', name: 'MOHAMMED ISHAQ' },
      { usn: '1DT24CS152', name: 'MOHAMMAD HANEEF BHAT' },
    ]
  },
  {
    teamNumber: 'C4',
    section: 'C',
    guideName: 'Mrs. K Deepashree',
    projectTitle: "AI based fake identity and document screening system",
    projectDescription: "5th Semester PBL Project: AI based fake identity and document screening system",
    students: [
      { usn: '1DT24CS116', name: 'Karishma' },
      { usn: '1DT24CS131', name: 'L G Nayana' },
      { usn: '1DT24CS169', name: 'Namratha S' },
      { usn: '1Dt24CS172', name: 'Nanditha S' },
    ]
  },
  {
    teamNumber: 'C5',
    section: 'C',
    guideName: 'Mrs. Kavyashree L',
    projectTitle: "An Intelligent Airport Ride-Sharing System",
    projectDescription: "5th Semester PBL Project: An Intelligent Airport Ride-Sharing System",
    students: [
      { usn: '1DT24CS122', name: 'Keerthi Devadiga' },
      { usn: '1DT24CS129', name: 'Kushi JR' },
      { usn: '1DT24CS140', name: 'Manavi HA' },
    ]
  },
  {
    teamNumber: 'C6',
    section: 'C',
    guideName: 'Mrs. Usha C R',
    projectTitle: "AI Heritage Reconstructor: AI-Based Monument Reconstruction and Augmented Reality Visualization",
    projectDescription: "5th Semester PBL Project: AI Heritage Reconstructor: AI-Based Monument Reconstruction and Augmented Reality Visualization",
    students: [
      { usn: '1DT24CS120', name: 'Kavana D S' },
      { usn: '1DT24CS144', name: 'Manyatha M V' },
      { usn: '1DT24CS160', name: 'Mohitha Y' },
      { usn: '1DT24CS167', name: 'Nagashree S' },
    ]
  },
  {
    teamNumber: 'C7',
    section: 'C',
    guideName: 'Mrs. Megha D',
    projectTitle: "AR Ambient Lighting Estimator for Synthetic 3D Objects",
    projectDescription: "5th Semester PBL Project: AR Ambient Lighting Estimator for Synthetic 3D Objects",
    students: [
      { usn: '1DT24CS146', name: 'Megha H' },
      { usn: '1DT24CS147', name: 'Meghana B S' },
      { usn: '1DT24CS130', name: 'Kusuma K S' },
      { usn: '1DT24CS156', name: 'Mohammed Tanaaz Ali' },
    ]
  },
  {
    teamNumber: 'C8',
    section: 'C',
    guideName: 'Mr. Orchu Venkata Koteswararao',
    projectTitle: "Smart Food Label Scanner & Nutrition Analyzer",
    projectDescription: "5th Semester PBL Project: Smart Food Label Scanner & Nutrition Analyzer",
    students: [
      { usn: '1DT24CS170', name: 'Nandan A Divate' },
      { usn: '1DT24CS159', name: 'Mohit S G' },
      { usn: '1DT24CS126', name: 'Krish Raj' },
      { usn: '1DT24CS171', name: 'Nandan M Chinchali' },
    ]
  },
  {
    teamNumber: 'C9',
    section: 'C',
    guideName: 'Mrs. Yamini',
    projectTitle: "Genovaire - Context Aware Health Monitoring for Advanced Health Analysis",
    projectDescription: "5th Semester PBL Project: Genovaire - Context Aware Health Monitoring for Advanced Health Analysis",
    students: [
      { usn: '1DT24CS137', name: 'Madhava K S Puranik' },
      { usn: '1DT24CS149', name: 'Mithun Kumar B V' },
      { usn: '1DT24CS153', name: 'Mohammed Abu Sufiyaan' },
      { usn: '1DT24CS155', name: 'Mohammed Sahil' },
    ]
  },
  {
    teamNumber: 'C10',
    section: 'C',
    guideName: 'Mrs. Divya H N',
    projectTitle: "TinyCare — Nurturing Mothers, Protecting Little Lives.",
    projectDescription: "5th Semester PBL Project: TinyCare — Nurturing Mothers, Protecting Little Lives.",
    students: [
      { usn: '1DT24CS125', name: 'Khushi C Hiremath' },
      { usn: '1DT24CS132', name: 'Lakshya D Basur' },
      { usn: '1DT24CS168', name: 'Namitha A Byrav' },
    ]
  },
  {
    teamNumber: 'C11',
    section: 'C',
    guideName: 'Mrs. Divya H N',
    projectTitle: "Filter Saathi",
    projectDescription: "5th Semester PBL Project: Filter Saathi",
    students: [
      { usn: '1DT24CS134', name: 'MM Rohiith' },
      { usn: '1DT24CS136', name: 'Maddineni Siri' },
      { usn: '1DT24CS138', name: 'Mahika Manjunath Pawar' },
      { usn: '1DT24CS143', name: 'Manushree S' },
    ]
  },
  {
    teamNumber: 'C12',
    section: 'C',
    guideName: 'Ms. Priya G',
    projectTitle: "QR code phishing checker and protection shield",
    projectDescription: "5th Semester PBL Project: QR code phishing checker and protection shield",
    students: [
      { usn: '1DT24CS117', name: 'Karthik B V' },
      { usn: '1DT25CS431', name: 'Kiran P' },
      { usn: '1DT24CS165', name: 'Nagaraj S' },
      { usn: '1DT24CS166', name: 'Nagaraj Kambale' },
    ]
  },
  {
    teamNumber: 'C13',
    section: 'C',
    guideName: 'Mrs. Lavanya K',
    projectTitle: "AI-Based Smart Civic Problem Detection and Management System",
    projectDescription: "5th Semester PBL Project: AI-Based Smart Civic Problem Detection and Management System",
    students: [
      { usn: '1DT25CS428', name: 'Jayashree S N' },
      { usn: '1DT25CS429', name: 'Kadambari J' },
      { usn: '1DT25CS432', name: 'Madhushree' },
      { usn: '1DT24CS124', name: 'Kesanapalli bhavyasree' },
    ]
  },
  {
    teamNumber: 'C14',
    section: 'C',
    guideName: 'Mr. Debabrata Borah',
    projectTitle: "An Integrated GIS-based Digital Public Infrastructure for Land Governance",
    projectDescription: "5th Semester PBL Project: An Integrated GIS-based Digital Public Infrastructure for Land Governance",
    students: [
      { usn: '1DT24CS163', name: 'Munikrishnamani' },
      { usn: '1DT24CS123', name: 'Keerthivardhan L' },
      { usn: '1DT25CS471', name: 'Vinay S S' },
      { usn: '1DT25CS424', name: 'H K Akash' },
    ]
  },
  {
    teamNumber: 'C15',
    section: 'C',
    guideName: 'Mr. Rahul Samanta',
    projectTitle: "GSTGuard AR: AI-Assisted Detection of Fake Invoices and Input Tax Credit Risk for Indian MSMEs",
    projectDescription: "5th Semester PBL Project: GSTGuard AR: AI-Assisted Detection of Fake Invoices and Input Tax Credit Risk for Indian MSMEs",
    students: [
      { usn: '1DT24CS133', name: 'M. Krishna Chaithanya' },
      { usn: '1DT24CS151', name: 'M.V Rithvik' },
      { usn: '1DT24CS157', name: 'Mohammed Yasin Muzammil' },
    ]
  },
  {
    teamNumber: 'C16',
    section: 'C',
    guideName: 'Ms. Nethra H L',
    projectTitle: "To Be Decided (TBD)",
    projectDescription: "Project topic and description to be finalized by team members and assigned guide.",
    students: [
      { usn: '1DT24CS148', name: 'Mehar Parnami' },
      { usn: '1DT24CS115', name: 'K R Niranjan' },
      { usn: '1DT24CS119', name: 'Kartikay Anand' },
      { usn: '1DT25CS430', name: 'Keerthana B G' },
    ]
  },
  {
    teamNumber: 'C17',
    section: 'C',
    guideName: 'Ms. Swetha V',
    projectTitle: "oncons-Online consultancy",
    projectDescription: "5th Semester PBL Project: oncons-Online consultancy",
    students: [
      { usn: '1DT24CS128', name: 'KUSHAL JAIN BS' },
      { usn: '1DT24CS161', name: 'MOHNISH A' },
      { usn: '1DT25CS425', name: 'HARSHA KS' },
      { usn: '1DT24CS127', name: 'KUMAR MANAS' },
    ]
  },

  // SECTION D
  {
    teamNumber: 'D1',
    section: 'D',
    guideName: 'Mrs. Deepthi R',
    projectTitle: "Action-Vani: Voice-Driven Agentic Execution Engine for Digital Public Services",
    projectDescription: "5th Semester PBL Project: Action-Vani: Voice-Driven Agentic Execution Engine for Digital Public Services",
    students: [
      { usn: '1DT24CS227', name: 'S Fiza' },
      { usn: '1DT24CS201', name: 'Priyanka Mandloi' },
      { usn: '1DT24CS181', name: 'Nitin Raj' },
      { usn: '1DT24CS223', name: 'Rithwik Girish Murthy' },
    ]
  },
  {
    teamNumber: 'D2',
    section: 'D',
    guideName: 'Ms. Kuheli Manna',
    projectTitle: "MedTimeline – Cross-Hospital Longitudinal Health Intelligence",
    projectDescription: "5th Semester PBL Project: MedTimeline – Cross-Hospital Longitudinal Health Intelligence",
    students: [
      { usn: '1DT24CS176', name: 'Niharika G' },
      { usn: '1DT24CS208', name: 'Rahiba Parveen' },
      { usn: '1DT24CS187', name: 'Pooja B' },
      { usn: '1DT24CS222', name: 'Riddhiman Sastri' },
    ]
  },
  {
    teamNumber: 'D3',
    section: 'D',
    guideName: 'Ms. Asha Latha',
    projectTitle: "AirPulse: Real-Time Air Quality Forecasting and Exposure-Aware Navigation Using a Hybrid ARIMA-LSTM Model",
    projectDescription: "5th Semester PBL Project: AirPulse: Real-Time Air Quality Forecasting and Exposure-Aware Navigation Using a Hybrid ARIMA-LSTM Model",
    students: [
      { usn: '1DT24CS188', name: 'Poorvitha Srinivas' },
      { usn: '1DT24CS192', name: 'Pranav Srikanth' },
      { usn: '1DT24CS198', name: 'Prithvinath A' },
      { usn: '1DT24CS217', name: 'Ranjita N' },
    ]
  },
  {
    teamNumber: 'D4',
    section: 'D',
    guideName: 'Mr. Harsha H N',
    projectTitle: "AR-Based Financial Literacy and Debt-Burden Visualizer for Rural and Semi-Literate Borrowers (\"See Your Debt\")",
    projectDescription: "5th Semester PBL Project: AR-Based Financial Literacy and Debt-Burden Visualizer for Rural and Semi-Literate Borrowers (\"See Your Debt\")",
    students: [
      { usn: '1DT24CS186', name: 'Parthiv Reddy M' },
      { usn: '1DT24CS207', name: 'Rachan Kumar CP' },
      { usn: '1DT24CS211', name: 'Rakesh Yadav' },
      { usn: '1DT24CS221', name: 'Revanth Kulkarni' },
    ]
  },
  {
    teamNumber: 'D5',
    section: 'D',
    guideName: 'Dr. C Nandini',
    projectTitle: "PreCog — Predictive Cognition Engine for Cyber Threat Forecasting",
    projectDescription: "5th Semester PBL Project: PreCog — Predictive Cognition Engine for Cyber Threat Forecasting",
    students: [
      { usn: '1DT24CS174', name: 'Neha' },
      { usn: '1DT24CS185', name: 'Pallavi Bammanni' },
      { usn: '1DT24CS195', name: 'Preethi S Pujari' },
      { usn: '1DT24CS232', name: 'Sagar R' },
    ]
  },
  {
    teamNumber: 'D6',
    section: 'D',
    guideName: 'Mrs. K Deepashree',
    projectTitle: "My Kisan Turn - AI-Enabled Agricultural Procurement with Predictive Queue Analytics and AR-Based Farmer Guidance",
    projectDescription: "5th Semester PBL Project: My Kisan Turn - AI-Enabled Agricultural Procurement with Predictive Queue Analytics and AR-Based Farmer Guidance",
    students: [
      { usn: '1DT24CS194', name: 'Prathiksha T S' },
      { usn: '1DT24CS213', name: 'Rakshita Ravindra Kanthi' },
      { usn: '1DT24CS214', name: 'Rakshitha C' },
      { usn: '1DT24CS215', name: 'Rakshitha D N' },
    ]
  },
  {
    teamNumber: 'D7',
    section: 'D',
    guideName: 'Ms. Apoorva Busad',
    projectTitle: "PackGuard: AI-Driven Fraud and Risk Detection with Visualization for Open-Source Packages",
    projectDescription: "5th Semester PBL Project: PackGuard: AI-Driven Fraud and Risk Detection with Visualization for Open-Source Packages",
    students: [
      { usn: '1DT24CS173', name: 'Neelambika B Sajjan' },
      { usn: '1DT24CS199', name: 'Priya M K' },
      { usn: '1DT24CS220', name: 'Ravikiran' },
      { usn: '1DT25CS436', name: 'Nanditha V' },
    ]
  },
  {
    teamNumber: 'D8',
    section: 'D',
    guideName: 'Mrs. Usha C R',
    projectTitle: "Fragile Package Monitoring and Chain-of-Custody System",
    projectDescription: "5th Semester PBL Project: Fragile Package Monitoring and Chain-of-Custody System",
    students: [
      { usn: '1DT24CS193', name: 'Prarthana M O' },
      { usn: '1DT24CS200', name: 'Priyanka B' },
      { usn: '1DT24CS203', name: 'Puneeth Kumar R' },
      { usn: '1DT24CS212', name: 'Rakshith Rao' },
    ]
  },
  {
    teamNumber: 'D9',
    section: 'D',
    guideName: 'Mrs. A Manusha Reddy',
    projectTitle: "AI-BLE Based Smart Personal Belonging Tracking and Lost Item Recovery System",
    projectDescription: "5th Semester PBL Project: AI-BLE Based Smart Personal Belonging Tracking and Lost Item Recovery System",
    students: [
      { usn: '1DT24CS184', name: 'Padmavati' },
      { usn: '1DT24CS216', name: 'Rakshitha R' },
      { usn: '1DT24CS218', name: 'Rashi Nayak' },
    ]
  },
  {
    teamNumber: 'D10',
    section: 'D',
    guideName: 'Dr. Nagaraj M Lutimath',
    projectTitle: "AR track safety Auditor",
    projectDescription: "5th Semester PBL Project: AR track safety Auditor",
    students: [
      { usn: '1DT24CS177', name: 'Nikhil S Kalyani' },
      { usn: '1DT24CS204', name: 'Punith S' },
      { usn: '1DT24CS226', name: 'S Dushyanth' },
      { usn: '1DT25CS444', name: 'Preran H Y' },
    ]
  },
  {
    teamNumber: 'D11',
    section: 'D',
    guideName: 'Ms. Mamatha A ',
    projectTitle: "EVADE — Emergency Virtual Adaptive Digital Evacuation",
    projectDescription: "5th Semester PBL Project: EVADE — Emergency Virtual Adaptive Digital Evacuation",
    students: [
      { usn: '1DT24CS178', name: 'Nisha A' },
      { usn: '1DT24CS189', name: 'Prajwal G K' },
      { usn: '1DT24CS197', name: 'Prithvi B M' },
      { usn: '1DT24CS206', name: 'R S Diya' },
    ]
  },
  {
    teamNumber: 'D12',
    section: 'D',
    guideName: 'Mr. Gajendra L',
    projectTitle: "MedPass — Emergency Medical Access System.",
    projectDescription: "5th Semester PBL Project: MedPass — Emergency Medical Access System.",
    students: [
      { usn: '1DT24CS179', name: 'Nishant B Shetty' },
      { usn: '1DT24CS190', name: 'Pranav Hedge' },
      { usn: '1DT24CS191', name: 'Pranav rai an' },
      { usn: '1DT24CS229', name: 'Sachin V' },
    ]
  },
  {
    teamNumber: 'D13',
    section: 'D',
    guideName: 'Mr. Nunna Rama Chandu',
    projectTitle: "VERITAS — Evidence-Based Verification of AI-Generated Responses Using Claim-Level Analysis",
    projectDescription: "5th Semester PBL Project: VERITAS — Evidence-Based Verification of AI-Generated Responses Using Claim-Level Analysis",
    students: [
      { usn: '1DT24CS219', name: 'Ratvik R' },
      { usn: '1DT24CS196', name: 'Prem' },
    ]
  },
  {
    teamNumber: 'D14',
    section: 'D',
    guideName: 'Ms. Swathi A',
    projectTitle: "AI-Based Pothole Detection and Road Safety Reporting Mobile Application",
    projectDescription: "5th Semester PBL Project: AI-Based Pothole Detection and Road Safety Reporting Mobile Application",
    students: [
      { usn: '1DT25CS437', name: 'Noor Madiha' },
      { usn: '1DT25CS445', name: 'Priyanka madagundi' },
      { usn: '1DT25CS442', name: 'Pramod S' },
      { usn: '1DT25CS443', name: 'Prashantha PM' },
    ]
  },
  {
    teamNumber: 'D15',
    section: 'D',
    guideName: 'Dr. Usha K C',
    projectTitle: "PersonalGluco-AI: A Personalized Non-Invasive Multimodal AI System for Individualized Glucose Estimation",
    projectDescription: "5th Semester PBL Project: PersonalGluco-AI: A Personalized Non-Invasive Multimodal AI System for Individualized Glucose Estimation",
    students: [
      { usn: '1DT24CS202', name: 'Pujari Poojitha' },
      { usn: '1DT24CS210', name: 'Rajashekhar Kakhandaki' },
      { usn: '1DT24CS228', name: 'S Sai Teja' },
      { usn: '1DT24CS182', name: 'Niya K B' },
    ]
  },
  {
    teamNumber: 'D16',
    section: 'D',
    guideName: 'Ms. Swetha V',
    projectTitle: "Ai-Powered Fraud Internship detection",
    projectDescription: "5th Semester PBL Project: Ai-Powered Fraud Internship detection",
    students: [
      { usn: '1DT24CS225', name: 'Ruban George Pathadan' },
      { usn: '1DT24CS231', name: 'Sagar K' },
      { usn: '1DT24CS209', name: 'Rahul Raj' },
      { usn: '1DT25CS438', name: 'Omkar g' },
    ]
  },
  {
    teamNumber: 'D17',
    section: 'D',
    guideName: 'Mr. Shreenidhi.B.S',
    projectTitle: "SmartSpend: Al-Powered Youth Spending & Parental Monitoring System",
    projectDescription: "5th Semester PBL Project: SmartSpend: Al-Powered Youth Spending & Parental Monitoring System",
    students: [
      { usn: '1DT24CS205', name: 'P Balaji Raghavendra' },
      { usn: '1DT25CS439', name: 'P Nanjundi Eranna' },
      { usn: '1DT24CS224', name: 'Rohith B' },
      { usn: '1DT24CS183', name: 'Omkar Bane' },
    ]
  },

  // SECTION E
  {
    teamNumber: 'E1',
    section: 'E',
    guideName: 'Ms. Asha Latha',
    projectTitle: "ShikshaSetu: AI-Based Student Success & Early Intervention",
    projectDescription: "5th Semester PBL Project: ShikshaSetu: AI-Based Student Success & Early Intervention",
    students: [
      { usn: '1DT24CS233', name: 'Sahebagouda Mulasavalagi' },
      { usn: '1DT24CS234', name: 'Sahil Kumar' },
      { usn: '1DT24CS241', name: 'Sanju d' },
      { usn: '1DT24CS245', name: 'Saraswathi' },
    ]
  },
  {
    teamNumber: 'E2',
    section: 'E',
    guideName: 'Mrs. Seema J K',
    projectTitle: "Autonomous IT Infrastrutcure Digital Twin",
    projectDescription: "5th Semester PBL Project: Autonomous IT Infrastrutcure Digital Twin",
    students: [
      { usn: '1DT24CS235', name: 'Samyuktha Samathgowd' },
      { usn: '1DT24CS240', name: 'Sanjana S' },
      { usn: '1DT24CS246', name: 'Shaik Luqman' },
      { usn: '1DT24CS281', name: 'Sohini' },
    ]
  },
  {
    teamNumber: 'E3',
    section: 'E',
    guideName: 'Mr. Parvathisha P',
    projectTitle: "Multi-Hazard 3D Digital Twin for Building Safety",
    projectDescription: "5th Semester PBL Project: Multi-Hazard 3D Digital Twin for Building Safety",
    students: [
      { usn: '1DT24CS250', name: 'Sharadhi K V' },
      { usn: '1DT24CS260', name: 'Shreyas C S' },
      { usn: '1DT24CS264', name: 'Shria G Shetty' },
      { usn: '1DT24CS275', name: 'Sneha Bhat K' },
    ]
  },
  {
    teamNumber: 'E4',
    section: 'E',
    guideName: 'Mr. Kondeti Dilip Kumar',
    projectTitle: "AI-Based Digital Twin for Campus Network Security",
    projectDescription: "5th Semester PBL Project: AI-Based Digital Twin for Campus Network Security",
    students: [
      { usn: '1DT24CS237', name: 'Saniya Mizba' },
      { usn: '1DT24CS247', name: 'Shaik Shehnaz' },
      { usn: '1DT24CS259', name: 'Shreya V' },
      { usn: '1DT24CS289', name: 'Srushti Ashok Naik' },
    ]
  },
  {
    teamNumber: 'E5',
    section: 'E',
    guideName: 'Mr. Orchu Venkata Koteswararao',
    projectTitle: "AI_Based Counterfeit Product Detection",
    projectDescription: "5th Semester PBL Project: AI_Based Counterfeit Product Detection",
    students: [
      { usn: '1DT24CS254', name: 'Shefalika Singh' },
      { usn: '1DT24CS255', name: 'Shifa Abida' },
      { usn: '1DT24CS268', name: 'Shristy Singh' },
      { usn: '1DT25CS451', name: 'Sanat Sankpal' },
    ]
  },
  {
    teamNumber: 'E6',
    section: 'E',
    guideName: 'Mr. Parvathisha P',
    projectTitle: "ClinicFlow: Unified Patient Journey Platform with AI Triage & AR Doctor Assistant",
    projectDescription: "5th Semester PBL Project: ClinicFlow: Unified Patient Journey Platform with AI Triage & AR Doctor Assistant",
    students: [
      { usn: '1DT24CS279', name: 'Sneha v' },
      { usn: '1DT24CS285', name: 'Spoorti B Patil' },
      { usn: '1DT25CS447', name: 'Rakshitha K B' },
      { usn: '1DT25CS453', name: 'Shalini B K' },
    ]
  },
  {
    teamNumber: 'E8',
    section: 'E',
    guideName: 'Ms. Meghana Nigam',
    projectTitle: "AI-Based OCR for Multilingual Script Detection and Translation",
    projectDescription: "5th Semester PBL Project: AI-Based OCR for Multilingual Script Detection and Translation",
    students: [
      { usn: '1DT24CS252', name: 'Sharma Narayan' },
      { usn: '1DT24CS253', name: 'Shashank D' },
      { usn: '1DT24CS242', name: 'Sanju TR' },
      { usn: '1DT24CS267', name: 'Shriram S Madivalar' },
    ]
  },
  {
    teamNumber: 'E9',
    section: 'E',
    guideName: 'Mr. Rahul Maity',
    projectTitle: "Posture and RSI Risk Detection for Desk Users",
    projectDescription: "5th Semester PBL Project: Posture and RSI Risk Detection for Desk Users",
    students: [
      { usn: '1DT24CS271', name: 'Siddartha H R' },
      { usn: '1DT24CS280', name: 'Snehith' },
      { usn: '1DT25CS454', name: 'Sharath kumar T N' },
      { usn: '1DT25CS456', name: 'Shashikumar H S' },
    ]
  },
  {
    teamNumber: 'E10',
    section: 'E',
    guideName: 'Ms. Nethra H L',
    projectTitle: "CityPulse: Ai powered Real time city intelligense and alert system platform",
    projectDescription: "5th Semester PBL Project: CityPulse: Ai powered Real time city intelligense and alert system platform",
    students: [
      { usn: '1DT24CS257', name: 'Shivam Raj Meenu' },
      { usn: '1DT24CS270', name: 'Siddarth V Rao Kunjur' },
      { usn: '1DT24CS273', name: 'Sidramreddy' },
      { usn: '1DT25CS455', name: 'Shashidhar Halli' },
    ]
  },
  {
    teamNumber: 'E11',
    section: 'E',
    guideName: 'Mrs. Manasa Sandeep',
    projectTitle: "AI-Powered Mental Health Screening and Support for Homeless Children",
    projectDescription: "5th Semester PBL Project: AI-Powered Mental Health Screening and Support for Homeless Children",
    students: [
      { usn: '1DT24CS276', name: 'Sneha Bidari' },
      { usn: '1DT24CS261', name: 'Shreyas Harvili' },
      { usn: '1DT24CS278', name: 'Sneha Sudhakar' },
      { usn: '1DT24CS286', name: 'Sreelakshmi MR' },
    ]
  },
  {
    teamNumber: 'E12',
    section: 'E',
    guideName: 'Mr. Jyothis K P',
    projectTitle: "CampusTwin AI: An Agentic AI-Powered Campus Digital Twin for Intelligent Operations and Sustainable Resource Optimization",
    projectDescription: "5th Semester PBL Project: CampusTwin AI: An Agentic AI-Powered Campus Digital Twin for Intelligent Operations and Sustainable Resource Optimization",
    students: [
      { usn: '1DT24CS248', name: 'Shailendra Kumar N' },
      { usn: '1DT24CS262', name: 'Shreyas S Trikannavar' },
      { usn: '1DT24CS277', name: 'Sneha H' },
      { usn: '1DT24CS291', name: 'Sulaksha Shetty' },
    ]
  },
  {
    teamNumber: 'E13',
    section: 'E',
    guideName: 'Mr. Keerthana Sankar',
    projectTitle: "AI-Driven Adaptive Career Roadmap and Personalized Skill Development Platform",
    projectDescription: "5th Semester PBL Project: AI-Driven Adaptive Career Roadmap and Personalized Skill Development Platform",
    students: [
      { usn: '1DT24CS236', name: 'Samsun' },
      { usn: '1DT24CS265', name: 'Shriharsha N' },
      { usn: '1DT24CS266', name: 'Shrikanth P Hiremath' },
      { usn: '1DT24CS288', name: 'Srivanth kumar M S' },
    ]
  },
  {
    teamNumber: 'E14',
    section: 'E',
    guideName: 'Ms. Vijaylaxmi Inamdar',
    projectTitle: "SteadyEye: A Drift-Aware, AR-Guided Setup Integrity Framework for Industrial AI Vision Inspection",
    projectDescription: "5th Semester PBL Project: SteadyEye: A Drift-Aware, AR-Guided Setup Integrity Framework for Industrial AI Vision Inspection",
    students: [
      { usn: '1DT24CS230', name: 'Sadanand T' },
      { usn: '1DT24CS251', name: 'Sharana Gouda' },
      { usn: '1DT24CS283', name: 'Soumya M Hiremath' },
      { usn: '1DT24CS290', name: 'Srushti Shelar' },
    ]
  },
  {
    teamNumber: 'E15',
    section: 'E',
    guideName: 'Mr. Parvathisha P',
    projectTitle: "AR-Based Data Center Navigation and Fault Visualization",
    projectDescription: "5th Semester PBL Project: AR-Based Data Center Navigation and Fault Visualization",
    students: [
      { usn: '1DT24CS244', name: 'Sanvi Anand Sarwad' },
      { usn: '1DT24CS284', name: 'Spandana Deepak' },
      { usn: '1DT24CS287', name: 'Srishti H Varagiri' },
    ]
  },
  {
    teamNumber: 'E16',
    section: 'E',
    guideName: 'Mrs. Swetha B',
    projectTitle: "SpendShield AI",
    projectDescription: "5th Semester PBL Project: SpendShield AI",
    students: [
      { usn: '1DT24CS238', name: 'Sanjana' },
      { usn: '1DT24CS269', name: 'Shwetha V Katewal' },
      { usn: '1DT24CS274', name: 'Sneha' },
      { usn: '1DT24CS258', name: 'Shree Ganesh K' },
    ]
  },
  {
    teamNumber: 'E17',
    section: 'E',
    guideName: 'Ms. Swetha V',
    projectTitle: "Blindspot AI",
    projectDescription: "5th Semester PBL Project: Blindspot AI",
    students: [
      { usn: '1DT25CS448', name: 'Ritika kumari' },
      { usn: '1DT25CS452', name: 'Sanjana k' },
      { usn: '1DT25CS458', name: 'Shivasagar' },
      { usn: '1DT25CS450', name: 'Samarth A R' },
    ]
  },
  {
    teamNumber: 'E18',
    section: 'E',
    guideName: 'Ms. Swathi A',
    projectTitle: "Smart Car Rental Management System",
    projectDescription: "5th Semester PBL Project: Smart Car Rental Management System",
    students: [
      { usn: '1DT25CS457', name: 'Shiva Charan Tej' },
      { usn: '1DT24CS243', name: 'Santhosh G' },
      { usn: '1DT25CS449', name: 'Rohan Gowda' },
      { usn: '1DT24CS256', name: 'Shishir Deshpande' },
    ]
  },

  // SECTION F
  {
    teamNumber: 'F1',
    section: 'F',
    guideName: 'Dr. Guruprasad B J',
    projectTitle: "VocaMind: An AI-Driven Voice-Based Mental Wellness Companion",
    projectDescription: "5th Semester PBL Project: VocaMind: An AI-Driven Voice-Based Mental Wellness Companion",
    students: [
      { usn: '1DT24CS299', name: 'Syedd Soha Firdaus' },
      { usn: '1DT24CS239', name: 'Sanjana LN' },
      { usn: '1DT24CS337', name: 'Yashas CM' },
      { usn: '1DT24CS341', name: 'Yuktha' },
    ]
  },
  {
    teamNumber: 'F2',
    section: 'F',
    guideName: 'Dr. Nagaraj Lutimath',
    projectTitle: "Gym Workout assistant AR Based app",
    projectDescription: "5th Semester PBL Project: Gym Workout assistant AR Based app",
    students: [
      { usn: '1DT24CS317', name: 'Vedant R B' },
      { usn: '1DT24CS320', name: 'Venkatesh S L' },
      { usn: '1DT24CS328', name: 'Vinith B G' },
      { usn: '1DT24CS333', name: 'Vishnu P V' },
    ]
  },
  {
    teamNumber: 'F3',
    section: 'F',
    guideName: 'Dr. Shalini S',
    projectTitle: "Quantum Image Processing-Based Configuration for Counterfeit Medicine Detection",
    projectDescription: "5th Semester PBL Project: Quantum Image Processing-Based Configuration for Counterfeit Medicine Detection",
    students: [
      { usn: '1DT24CS295', name: 'Suraj p reddy' },
      { usn: '1DT24CS338', name: 'Yashaswi' },
      { usn: '1DT25CS461', name: 'Suchithra P' },
      { usn: '1DT24CS336', name: 'Wamique Ali Warsi' },
    ]
  },
  {
    teamNumber: 'F4',
    section: 'F',
    guideName: 'Mrs. Dasari Bhulakshmi',
    projectTitle: "DronePath AI – Intelligent Drone Flight Path Optimization",
    projectDescription: "5th Semester PBL Project: DronePath AI – Intelligent Drone Flight Path Optimization",
    students: [
      { usn: '1DT24CS342', name: 'Yuvraj Mohan' },
      { usn: '1DT24CS297', name: 'Syed Aman Zabi' },
      { usn: '1DT24CS301', name: 'Talha Riyan Pasha' },
      { usn: '1DT24CS325', name: 'Vikash Kumawat' },
    ]
  },
  {
    teamNumber: 'F5',
    section: 'F',
    guideName: 'Dr. Shiva Sumanth Reddy',
    projectTitle: "SIGNOVA: Early Detection of Financial ML Model Failure Under Changing Predictor–Outcome Relationships",
    projectDescription: "5th Semester PBL Project: SIGNOVA: Early Detection of Financial ML Model Failure Under Changing Predictor–Outcome Relationships",
    students: [
      { usn: '1DT24CS314', name: 'Varna T' },
      { usn: '1DT24CS313', name: 'Varada Nayak' },
      { usn: '1DT24CS312', name: 'Vanitha KR' },
    ]
  },
  {
    teamNumber: 'F6',
    section: 'F',
    guideName: 'Dr. Shivanna K',
    projectTitle: "EcoWatt: An IoT and Android-Based Smart Campus Energy Monitoring, Alert, and Remote Load Control System",
    projectDescription: "5th Semester PBL Project: EcoWatt: An IoT and Android-Based Smart Campus Energy Monitoring, Alert, and Remote Load Control System",
    students: [
      { usn: '1DT25CS466', name: 'Varsha CM' },
      { usn: '1DT25CS434', name: 'Nandeesha HG' },
      { usn: '1DT25CS473', name: 'Yashwanth KG' },
      { usn: '1DT25CS472', name: 'Viswas G' },
    ]
  },
  {
    teamNumber: 'F7',
    section: 'F',
    guideName: 'Dr. Muzameel Ahmed',
    projectTitle: "AI-DRIVEN NEONATAL INTENSIVE CARE (NICU) INFANT MONITORING SYSTEM",
    projectDescription: "5th Semester PBL Project: AI-DRIVEN NEONATAL INTENSIVE CARE (NICU) INFANT MONITORING SYSTEM",
    students: [
      { usn: '1DT25CS468', name: 'Vepa Sai Krishna Sarma' },
      { usn: '1DT24CS304', name: 'Tejasvita Satyarshi' },
      { usn: '1DT24CS316', name: 'Varun Choudhary' },
      { usn: '1DT24CS323', name: 'Vidhi Chatterjee' },
    ]
  },
  {
    teamNumber: 'F8',
    section: 'F',
    guideName: 'Mr. Harsha H N',
    projectTitle: "Intramap - AI-Powered Indoor intelligent Navigation",
    projectDescription: "5th Semester PBL Project: Intramap - AI-Powered Indoor intelligent Navigation",
    students: [
      { usn: '1DT24CS293', name: 'Sumith' },
      { usn: '1DT24CS296', name: 'Swayam Manjunath Raikar' },
      { usn: '1DT24CS306', name: 'Thejasvi Krishna B' },
      { usn: '1DT24CS307', name: 'Trupthi V Hanchate' },
    ]
  },
  {
    teamNumber: 'F9',
    section: 'F',
    guideName: 'Mr. Gajendra L',
    projectTitle: "Development of a Multi-Sensor Edge-Based System for Early Detection and Protection of Water Pump Faults",
    projectDescription: "5th Semester PBL Project: Development of a Multi-Sensor Edge-Based System for Early Detection and Protection of Water Pump Faults",
    students: [
      { usn: '1DT24CS300', name: 'T R Dhanyashri' },
      { usn: '1DT24CS326', name: 'Vinayaka' },
      { usn: '1DT24CS329', name: 'Vinuta J H' },
      { usn: '1DT25CS463', name: 'Suketh E' },
    ]
  },
  {
    teamNumber: 'F10',
    section: 'F',
    guideName: 'Mrs. Shilpa M',
    projectTitle: "TwinView: A Vision-Driven Mobile System for Physical-to-Digital Industrial Asset Association",
    projectDescription: "5th Semester PBL Project: TwinView: A Vision-Driven Mobile System for Physical-to-Digital Industrial Asset Association",
    students: [
      { usn: '1DT24CS318', name: 'Veeksha Dinesh' },
      { usn: '1DT24CS322', name: 'Vibhashree S' },
      { usn: '1DT24CS327', name: 'Vinaykumar S H' },
      { usn: '1DT24CS339', name: 'Yashaswini M' },
    ]
  },
  {
    teamNumber: 'F11',
    section: 'F',
    guideName: 'Dr. Nagaraj Lutimath',
    projectTitle: "Early Sepsis Risk Prediction Using LSTM/Transformer-Based Time-Series Analysis",
    projectDescription: "5th Semester PBL Project: Early Sepsis Risk Prediction Using LSTM/Transformer-Based Time-Series Analysis",
    students: [
      { usn: '1DT24CS309', name: 'Vaidehi N Kulkarni' },
      { usn: '1DT24CS310', name: 'Vaishnavi YashoKirthi S' },
      { usn: '1DT24CS315', name: 'Varshini Devi M' },
      { usn: '1DT24CS332', name: 'Vishnu M' },
    ]
  },
  {
    teamNumber: 'F12',
    section: 'F',
    guideName: 'Mrs. Arpitha Vasudev',
    projectTitle: "Plant Watering Assistant for Home or Campus Plants",
    projectDescription: "5th Semester PBL Project: Plant Watering Assistant for Home or Campus Plants",
    students: [
      { usn: '1DT24CS305', name: 'THANU G' },
      { usn: '1DT25CS464', name: 'THANUSHRI P' },
      { usn: '1DT25CS467', name: 'VARSHINI G' },
      { usn: '1DT25CS469', name: 'VIJAY G A' },
    ]
  },
  {
    teamNumber: 'F13',
    section: 'F',
    guideName: 'Mrs. Swetha B',
    projectTitle: "ML-Based Automated Land Subdivision and Interactive 3D Layout Generation",
    projectDescription: "5th Semester PBL Project: ML-Based Automated Land Subdivision and Interactive 3D Layout Generation",
    students: [
      { usn: '1dt24cs294', name: 'Supreeth C R' },
      { usn: '1dt24cs308', name: 'V Yoitha' },
      { usn: '1dt24cs311', name: 'Vamshi Reddy H S' },
      { usn: '1DT24Cs321', name: 'Vennela V' },
    ]
  },
  {
    teamNumber: 'F14',
    section: 'F',
    guideName: 'Mrs. Bhavya V',
    projectTitle: "Vartis: Live Search",
    projectDescription: "5th Semester PBL Project: Vartis: Live Search",
    students: [
      { usn: '1DT24CS292', name: 'Sumit Reddy' },
      { usn: '1DT24CS303', name: 'Taymoor Farooq' },
      { usn: '1DT24CS272', name: 'Siddartha H' },
      { usn: '1DT25CS465', name: 'Vaishnavi Kamble' },
    ]
  },
  {
    teamNumber: 'F15',
    section: 'F',
    guideName: 'Ms. Mamatha A',
    projectTitle: "FoodVision – AI-Based Personalized Diet Monitoring System",
    projectDescription: "5th Semester PBL Project: FoodVision – AI-Based Personalized Diet Monitoring System",
    students: [
      { usn: '1DT24CS302', name: 'Tarun k' },
      { usn: '1DT24CS330', name: 'Vishal LJ' },
      { usn: '1DT24CS335', name: 'Vishwas Patil' },
      { usn: '1DT25CS459', name: 'Shridhar Vinodsa Solanki' },
    ]
  },
  {
    teamNumber: 'F16',
    section: 'F',
    guideName: 'Mrs. A Manusha Reddy',
    projectTitle: "Vigilance AI.",
    projectDescription: "5th Semester PBL Project: Vigilance AI.",
    students: [
      { usn: '1DT24CS324', name: 'Vikas M' },
      { usn: '1DT24CS331', name: 'Vishnu Kulkarni' },
      { usn: '1DT24CS334', name: 'Vishwas M' },
      { usn: '1DT24CS340', name: 'Yogesh' },
    ]
  }
];

const FACULTY_DATA = [
  { name: "Mrs. APOORVA BUSAD", mobile: "8762295119", email: "apoorvabusad-cse@dsatm.edu.in" },
  { name: "Mrs. ARPITHA VASUDEV", mobile: "9742105602", email: "arpithavasudev-cse@dsatm.edu.in" },
  { name: "Mrs. Bhavya V", mobile: "8660728714", email: "bhavya-cse@dsatm.edu.in" },
  { name: "Mr. CHANDRASHEKAR G", mobile: "9632598543", email: "chandrashekar-cse@dsatm.edu.in" },
  { name: "Dr. NANDINI C", mobile: "9972634890", email: "vp@dsatm.edu.in" },
  { name: "Mrs. DIVYA H N", mobile: "8722073156", email: "divyahn-cse@dsatm.edu.in" },
  { name: "Mrs. DEEPASHREE K", mobile: "8792822966", email: "deepashree-cse@dsatm.edu.in" },
  { name: "Ms. DEEPTHI R", mobile: "8197323812", email: "deepthi-cse@dsatm.edu.in" },
  { name: "Dr. USHA K C", mobile: "7760489523", email: "ushagautamsk@gmail.com" },
  { name: "Dr. DASARI BHULAKSHMI", mobile: "9379160729", email: "bhulakshmi-cse@dsatm.edu.in" },
  { name: "Ms. DR. SEEMA J K", mobile: "9611955448", email: "seema-cse@dsatm.edu.in" },
  { name: "Mr. DILIP KUMAR K", mobile: "9381642589", email: "dilipkumar-cse@dsatm.edu.in" },
  { name: "Mr. GAJENDRA L", mobile: "8494875135", email: "gajendra-cse@dsatm.edu.in" },
  { name: "Dr. GURUPRASAD B JAYARAO", mobile: "9480934137", email: "guruprasad-cse@dsatm.edu.in" },
  { name: "Mr. HARSHA H N", mobile: "8073994889", email: "harsha-cse@dsatm.edu.in" },
  { name: "Mr. JYOTHIS K P", mobile: "9496701234", email: "jyothis-cse@dsatm.edu.in" },
  { name: "Mrs. KEERTHANA SHANKAR", mobile: "9448558918", email: "keerthana-cs@dsatm.edu.in" },
  { name: "Mrs. KAVYASHREE L", mobile: "9739375511", email: "kavyashree-cse@dsatm.edu.in" },
  { name: "Ms. KUHELI MANNA", mobile: "8250308080", email: "kuheli-cse@dsatm.edu.in" },
  { name: "Ms. LAVANYA K", mobile: "9740961670", email: "lavanya-cse@dsatm.edu.in" },
  { name: "Ms. LITHU MATHEW", mobile: "8111937903", email: "lithu-cse@dsatm.edu.in" },
  { name: "Dr. MUZAMEEL AHMED", mobile: "9980465900", email: "muzchk@yahoo.com" },
  { name: "Mrs. MANASA SANDEEP", mobile: "8884401410", email: "manasa-cs@dsatm.edu.in" },
  { name: "Ms. Mamatha A", mobile: "7022539072", email: "mamatha-cse@dsatm.edu.in" },
  { name: "Ms. MANUSHA A", mobile: "7411052155", email: "manusha-cse@dsatm.edu.in" },
  { name: "Ms. MEGHA D", mobile: "9035204428", email: "shreyajayanth27@gmail.com" },
  { name: "Ms. MEGHANA NIGAM", mobile: "8431864012", email: "meghana-cse@dsatm.edu.in" },
  { name: "Dr. NAGARAJ M LUTIMATH", mobile: "8105510183", email: "Nagarajml-cse@dsatm.edu.in" },
  { name: "Mr. ORCHU VENKATA KOTESWARA RAO", mobile: "9514348881", email: "orchuvenkata-cse@dsatm.edu.in" },
  { name: "Mr. PARVATHISHA PUDUGOSULA", mobile: "9550011981", email: "parvathisha-cse@dsatm.edu.in" },
  { name: "Mr. RAMA CHANDU N", mobile: "6304385198", email: "ramachandu-cse@dsatm.edu.in" },
  { name: "Mr. RAHUL MAITY", mobile: "9088985200", email: "rahul-cse@dsatm.edu.in" },
  { name: "Mr. RAHUL SAMANTA", mobile: "8768892913", email: "rahulsamanta-cse@dsatm.edu.in" },
  { name: "Mr. SHREENIDHI B S", mobile: "9731927999", email: "Shreenidhibs@dsatm.edu.in" },
  { name: "Dr. SHIVA SUMANTH REDDY", mobile: "8618732655", email: "sumanth-cse@dsatm.edu.in" },
  { name: "Mrs. SHILPA M", mobile: "9845581375", email: "shilpa-cse@dsatm.edu.in" },
  { name: "Dr. Shalini", mobile: "9535693937", email: "dr.shalini-cse@dsatm.edu.in" },
  { name: "Ms. SWATHI A", mobile: "8762944294", email: "swathi-cse@dsatm.edu.in" },
  { name: "Dr. SHIVANNA K", mobile: "9686194749", email: "shivanna-cse@dsatm.edu.in" },
  { name: "Ms. SWETHA B", mobile: "8123548782", email: "swetha-cse@dsatm.edu.in" },
  { name: "Ms. SWETHA V", mobile: "9513025499", email: "swethav-cse@dsatm.edu.in" },
  { name: "Mrs. USHA C R", mobile: "9972737259", email: "usha-cse@dsatm.edu.in" },
  { name: "Dr. VIJAYLAXMI INAMDAR", mobile: "9845180180", email: "Vijaylaxmi-cse@dsatm.edu.in" },
  { name: "Mrs. Yamini G", mobile: "9886770763", email: "yamini-cse@dsatm.edu.in" },
  { name: "Ms. ASHALATHA N S", mobile: "8197556888", email: "ashalatha-cse@dsatm.edu.in" },
  { name: "Ms. NETHRA H L", mobile: "9606409077", email: "nethra-cse@dsatm.edu.in" },
  { name: "Ms. PRIYA G", mobile: "9845012301", email: "priyag-cse@dsatm.edu.in" },
  { name: "Mr. DEBABRATA BORAH", mobile: "9845012302", email: "debabrata-cse@dsatm.edu.in" }
];

function normalizeName(name: string) {
  const lower = name.toLowerCase().trim();
  const ALIASES: Record<string, string> = {
    'dr. c nandini': 'Dr. NANDINI C',
    'mr. nunna rama chandu': 'Mr. RAMA CHANDU N',
    'mr. keerthana sankar': 'Mrs. KEERTHANA SHANKAR',
    'mr. kondeti dilip kumar': 'Mr. DILIP KUMAR K',
    'mrs. k deepashree': 'Mrs. DEEPASHREE K',
    'mrs. a manusha reddy': 'Ms. MANUSHA A',
    'dr. nagaraj lutimath': 'Dr. NAGARAJ M LUTIMATH',
    'ms. priya g': 'Ms. PRIYA G',
    'mr. debabrata borah': 'Mr. DEBABRATA BORAH'
  };

  const mapped = ALIASES[lower] || name;
  return mapped.toLowerCase()
    .replace(/^(dr\.|mr\.|mrs\.|ms\.)\s*/, '')
    .replace(/[^a-z0-9]/g, '');
}

// Helper to normalize guide email
export function getGuideEmail(guideName: string): string {
  const normGuide = normalizeName(guideName);
  const found = FACULTY_DATA.find(f => {
    const normF = normalizeName(f.name);
    return normF.includes(normGuide) || normGuide.includes(normF);
  });

  if (found) {
    return found.email;
  }

  const cleanName = guideName.toLowerCase()
    .replace(/^(dr\.|mr\.|mrs\.|ms\.)\s*/, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${cleanName}-cse@dsatm.edu.in`;
}

// Helper to normalize guide phone / default initial password
export function getGuidePhone(guideName: string): string {
  const normGuide = normalizeName(guideName);
  const found = FACULTY_DATA.find(f => {
    const normF = normalizeName(f.name);
    return normF.includes(normGuide) || normGuide.includes(normF);
  });

  if (found) {
    return found.mobile;
  }

  let hash = 0;
  for (let i = 0; i < guideName.length; i++) {
    hash = (hash << 5) - hash + guideName.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash).toString().slice(0, 10).padStart(10, '9');
  return `95500${posHash.slice(5)}`;
}
