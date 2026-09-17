import { RAW_PDF_SEED, getGuideEmail, getGuidePhone } from './seed-dataset';

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
  { name: "Ms. ASHALATHA N S", mobile: "8197556888", email: "ashalatha-cse@dsatm.edu.in" }
];

const facultyEmails = new Set(FACULTY_DATA.map(f => f.email));

console.log("Unmatched Guides:");
const unmatched = new Set();
RAW_PDF_SEED.forEach(team => {
  const email = getGuideEmail(team.guideName);
  if (!facultyEmails.has(email)) {
    unmatched.add(team.guideName + ' -> generated: ' + email);
  }
});
console.log(Array.from(unmatched).join('\n'));
