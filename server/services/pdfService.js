import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCUMENTS_DIR = path.join(__dirname, '../uploads/documents');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function generateMutualAcceptance({ student, supervisor, title, date }) {
  ensureDir(DOCUMENTS_DIR);
  const filename = `mutual_acceptance_${student.id}_${supervisor.id}_${Date.now()}.pdf`;
  const filePath = path.join(DOCUMENTS_DIR, filename);
  const relativePath = path.join('documents', filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).fillColor('#8B0000').text('Universiti Teknologi MARA (UiTM)', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('#1E3A5F').text('Final Year Project - Mutual Acceptance Form', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).fillColor('#000000');
    doc.text(`Date: ${date.toLocaleDateString()}`);
    doc.moveDown(2);

    doc.text('This document certifies the mutual acceptance of supervision for the following Final Year Project:');
    doc.moveDown();

    doc.fontSize(14).fillColor('#1E3A5F').text(title || '(No title specified)', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).fillColor('#000000');
    doc.text('Student:');
    doc.text(`  Name: ${student.name}`);
    doc.text(`  Email: ${student.email}`);
    doc.moveDown();

    doc.text('Supervisor:');
    doc.text(`  Name: ${supervisor.name}`);
    doc.text(`  Email: ${supervisor.email}`);
    doc.moveDown(3);

    doc.text('_________________________');
    doc.text('Student Signature');
    doc.moveDown(2);
    doc.text('_________________________');
    doc.text('Supervisor Signature');

    doc.end();

    stream.on('finish', () => resolve(relativePath));
    stream.on('error', reject);
  });
}

export function generateProgressReport({ student, supervisor, submissions, meetings }) {
  ensureDir(DOCUMENTS_DIR);
  const filename = `progress_report_${student.id}_${Date.now()}.pdf`;
  const filePath = path.join(DOCUMENTS_DIR, filename);
  const relativePath = path.join('documents', filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).fillColor('#8B0000').text('Universiti Teknologi MARA (UiTM)', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('#1E3A5F').text('FYP Progress Report', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).fillColor('#000000');
    doc.text(`Student: ${student.name} (${student.email})`);
    doc.text(`Supervisor: ${supervisor.name}`);
    doc.moveDown(2);

    doc.fontSize(14).text('Submissions');
    doc.fontSize(10);
    if (submissions && submissions.length > 0) {
      submissions.forEach((s, i) => {
        doc.text(`${i + 1}. ${s.title} - ${s.submission_type} (${s.status}) - ${new Date(s.submitted_at).toLocaleDateString()}`);
      });
    } else {
      doc.text('No submissions yet.');
    }
    doc.moveDown(2);

    doc.fontSize(14).text('Meetings');
    doc.fontSize(10);
    if (meetings && meetings.length > 0) {
      meetings.forEach((m, i) => {
        doc.text(`${i + 1}. ${m.meeting_date} ${m.meeting_time} - ${m.location || 'N/A'} (${m.status})`);
      });
    } else {
      doc.text('No meetings logged yet.');
    }

    doc.end();

    stream.on('finish', () => resolve(relativePath));
    stream.on('error', reject);
  });
}
