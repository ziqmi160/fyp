import sequelize from '../config/database.js';
import RubricTemplate from '../models/RubricTemplate.js';

const RUBRICS = [
  {
    form_type: 'F2',
    name: 'F2 – Project Motivation Evaluation Form',
    criteria: [
      { id: 1, name: 'Problem identification', description: 'Identify problems/issues/opportunities', weight: 3, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 2, name: 'Evidences', description: 'Evidences to support problems/issues/opportunities identified.', weight: 5, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 3, name: 'Solutions', description: 'Propose solutions.', weight: 2, score_min: 1, score_max: 10, supervisor_only: false, group: null },
    ]
  },
  {
    form_type: 'F3',
    name: 'F3 – Literature Review Evaluation Form',
    criteria: [
      { id: 1, name: 'Relevance and context', description: 'Identify problems/issues/opportunities', weight: 2, score_min: 0, score_max: 10, supervisor_only: false, group: null },
      { id: 2, name: 'Knowledge of the field/sources', description: 'Knowledge of the field/sources', weight: 4, score_min: 0, score_max: 10, supervisor_only: false, group: null },
      { id: 3, name: 'Writing', description: 'Summary based on references', weight: 4, score_min: 0, score_max: 10, supervisor_only: false, group: null },
    ]
  },
  {
    form_type: 'F4',
    name: 'F4 – Methodology Evaluation Form',
    criteria: [
      { id: 1, name: 'Design of the methodology', description: 'Appropriate and comprehensible design of the methodology', weight: 3, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 2, name: 'Description', description: 'Comprehensible and detailed description of each component in methodology', weight: 3, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 3, name: 'Model/Technique/Method', description: 'Model/Technique/Method employed', weight: 4, score_min: 1, score_max: 10, supervisor_only: false, group: null },
    ]
  },
  {
    form_type: 'F7',
    name: 'F7 – Project Formulation Presentation Form',
    criteria: [
      { id: 1, name: 'Depth of Knowledge', description: 'Possess a clear understanding and able to explain the subject matter.', weight: 3, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 2, name: 'Overall Organization of the Project Presentation', description: 'Exhibit/Present the project in a clear, engaging and appropriate form.', weight: 2, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 3, name: 'Use Quality of Presentation Materials', description: 'Use several materials or media in presenting the project.', weight: 2, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 4, name: 'Delivery Skills', description: 'Proper language used, speak clearly, loudly and at appropriate pace, effective eye contact and presentable attitude.', weight: 3, score_min: 1, score_max: 10, supervisor_only: false, group: null },
    ]
  },
  {
    form_type: 'F8',
    name: 'F8 – Project Formulation Report Evaluation Form',
    criteria: [
      { id: 1, name: 'Project Background and Problem', description: 'Appropriate working title, clear problem statement, well-defined project scope.', weight: 3, score_min: 0, score_max: 10, supervisor_only: false, group: null },
      { id: 2, name: 'Objectives', description: 'Clear, measurable and achievable.', weight: 2, score_min: 0, score_max: 10, supervisor_only: false, group: null },
      { id: 3, name: 'Significance of the Study', description: 'Relevant to the community and practitioners.', weight: 1, score_min: 0, score_max: 10, supervisor_only: false, group: null },
      { id: 4, name: 'Literature Review', description: 'Able to identify, collect, summarize and analyze relevant and latest issues of subject matter.', weight: 5, score_min: 0, score_max: 10, supervisor_only: false, group: null },
      { id: 5, name: 'Project Methodology', description: 'Appropriate approach, methods, sources and deliverables in accomplishing the project.', weight: 6, score_min: 0, score_max: 10, supervisor_only: false, group: null },
      { id: 6, name: 'Presentation of the Report', description: 'Follow the given guidelines, consistency of the contents, clarity, and language of the report, contain valid references and citations.', weight: 3, score_min: 0, score_max: 10, supervisor_only: false, group: null },
      { id: 7, name: 'Progress Evaluation (Supervisor Only)', description: 'This may include supervisory meetings (Project In-Progress Form- F3), supervisory independency, responsibilities, commitment, maturity, etc.', weight: 2, score_min: 0, score_max: 10, supervisor_only: true, group: null },
    ]
  },
  {
    form_type: 'F9',
    name: 'F9 – Progress Project Presentation Form',
    criteria: [
      { id: 1, name: 'Depth of Knowledge', description: 'Possess high understanding and able to explain subject matter', weight: 3, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 2, name: 'Overall Organization of Project Presentation', description: 'Exhibit/Present the project in a clear, engaging and appropriate form', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 3, name: 'Progress', description: 'Perform necessary processes to meet stated project objectives aligned with Gantt Chart/Milestones', weight: 4, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 4, name: 'Delivery Skills', description: 'Proper language used, speak clearly, loudly and at appropriate pace, effective eye contact and presentable attitude', weight: 2, score_min: 1, score_max: 10, supervisor_only: false, group: null },
    ]
  },
  {
    form_type: 'F10',
    name: 'F10 – Final Project Presentation Form',
    criteria: [
      { id: 1, name: 'Depth of Knowledge', description: 'Possess high understanding and able to explain subject matter', weight: 3, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 2, name: 'Overall Organization of Project Presentation', description: 'Exhibit/Present the project in a clear, engaging and appropriate form', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 3, name: 'Poster Organization', description: 'Appropriate content, relevant graphics, attractiveness', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 4, name: 'Research/Project Complexity Appropriate to Discipline', description: 'Exhibit some level of complexity', weight: 2, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 5, name: 'Research/Project Completeness Appropriate to Discipline', description: 'Exhibit some level of completeness', weight: 2, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 6, name: 'Delivery Skills', description: 'Proper language used, speak clearly, loudly and at appropriate pace, effective eye contact and presentable attitude', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
    ]
  },
  {
    form_type: 'F11',
    name: 'F11 – Project Report Evaluation Form',
    criteria: [
      { id: 1,  name: 'Abstract',                    description: 'Summarizes the whole project – consists of project motivation, methodology, findings and future work.',                                                                                      weight: 1, score_min: 0, score_max: 10, supervisor_only: false, group: 'CLO1' },
      { id: 2,  name: 'Introduction',                description: 'Appropriate title; clear problem statement; well-defined project scope; clear, measurable and achievable objectives; and significant to the community and practitioners.',                weight: 1, score_min: 0, score_max: 10, supervisor_only: false, group: 'CLO1' },
      { id: 3,  name: 'Literature Review',           description: 'Review of current, related literature and research reports. Consist of relevant, correct facts and substantial references - able to identify, collect, summarize and analyze relevant and latest/issues of subject matter.', weight: 1, score_min: 0, score_max: 10, supervisor_only: false, group: 'CLO1' },
      { id: 4,  name: 'Methodology',                description: 'A detailed and in depth explanation of the appropriate approach, methods, sources and deliverables in accomplishing the project.',                                                        weight: 2, score_min: 0, score_max: 10, supervisor_only: false, group: 'CLO1' },
      { id: 5,  name: 'Conclusion and Recommendations', description: 'Conclusion of what has been achieved, explaining limitations/problems and recommendation for future work.',                                                                           weight: 2, score_min: 0, score_max: 10, supervisor_only: false, group: 'CLO1' },
      { id: 6,  name: 'Report Presentation',         description: 'Structure, organisation and standard report format. Clarity of language, consistency of the content, logical flow and use of figurative language for all materials.',                   weight: 1, score_min: 0, score_max: 10, supervisor_only: false, group: 'CLO1' },
      { id: 7,  name: 'References and Citations',    description: 'Standard citation and references based on the guideline given. Valid source of references and other appropriate supporting documents.',                                                  weight: 2, score_min: 0, score_max: 10, supervisor_only: false, group: 'CLO1' },
      { id: 8,  name: 'Progress Evaluation (supervisor only)', description: 'This may include supervisory meetings (Project In-Progress Form-F3), supervisory independency, responsibilities, commitment, maturity, etc.',                              weight: 1, score_min: 0, score_max: 10, supervisor_only: true, group: 'CLO1' },
      { id: 9,  name: 'Development',                 description: 'Algorithm/prototype/coding/user interface/documentation/Design Artifact/Requirement Diagram/Design Diagram that appropriate to the discipline',                                          weight: 5, score_min: 0, score_max: 10, supervisor_only: false, group: 'CLO4' },
      { id: 10, name: 'Findings/Discussion',         description: 'The result of research carried out to solve the problem defined. This may include analysis/usability/design/implementation/testing/evaluation, validation/prototype or framework that appropriate to the discipline', weight: 5, score_min: 0, score_max: 10, supervisor_only: false, group: 'CLO4' },
    ]
  },
  {
    form_type: 'F13',
    name: 'F13 – Lean Canvas Model Evaluation Form',
    criteria: [
      { id: 1, name: 'Problem',                  description: 'Clarity and relevance of the key stakeholder problem.',               weight: 2, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 2, name: 'Solution',                 description: 'Description of how solution features address the stakeholder problem.', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 3, name: 'Key Metrics',              description: 'Means of monitoring solution performance (usability testing, competitor tracking, market performance monitoring).', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 4, name: 'Unique Value Proposition', description: 'Value proposition relevant and specific to stakeholders with convincing statement on why they would choose the solution.', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 5, name: 'Unfair Advantage',         description: 'Statement on why the solution would be worthwhile to invest in.',     weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 6, name: 'Channels',                 description: 'Channel of choice suitable to the stakeholders and means of delivering the solution.', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 7, name: 'Customer Segments',        description: 'Stakeholder segment clearly identified with convincing listing on potential future segments.', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 8, name: 'Cost Structure',           description: 'Clear and sensible structure on operational costs in converting the solution into a startup.', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
      { id: 9, name: 'Revenue Streams',          description: 'Clear and sensible plan in gaining customer traction to purchase solution and in maintaining profit.', weight: 1, score_min: 1, score_max: 10, supervisor_only: false, group: null },
    ]
  }
];

async function seedRubrics() {
  await sequelize.authenticate();
  let upserted = 0;
  for (const rubric of RUBRICS) {
    await RubricTemplate.upsert(rubric);
    upserted++;
  }
  console.log(`Seeded ${upserted} rubric templates.`);
  await sequelize.close();
}

seedRubrics().catch((e) => { console.error(e); process.exit(1); });
