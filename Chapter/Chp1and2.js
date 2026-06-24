import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageBreak, LevelFormat, ExternalHyperlink
} from 'docx';
import fs from 'fs';

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerShading = { fill: "2E75B6", type: ShadingType.CLEAR };
const altShading = { fill: "EAF2FB", type: ShadingType.CLEAR };

function para(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 360 },
    children: [new TextRun({ text, size: 24, font: "Times New Roman" })]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "objbullets", level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 80, line: 360 },
    children: [new TextRun({ text, size: 24, font: "Times New Roman" })]
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, font: "Times New Roman" })]
  });
}

function refPara(runs) {
  // hanging indent reference entry
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 80, line: 360 },
    indent: { left: 720, hanging: 720 },
    children: runs.map(r => (r instanceof TextRun || r instanceof ExternalHyperlink) ? r : new TextRun({ size: 24, font: "Times New Roman", ...r }))
  });
}

function link(url) {
  return new ExternalHyperlink({
    children: [new TextRun({ text: url, size: 24, font: "Times New Roman", style: "Hyperlink" })],
    link: url
  });
}

function tcell(text, opts = {}) {
  const { width, shading, bold = false, color } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text, size: 19, font: "Times New Roman", bold, color })]
    })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Times New Roman" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Times New Roman" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, font: "Times New Roman" },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "objbullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 }
      }
    },
    children: [

      // ══════════════════ CHAPTER 1 ══════════════════
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "CHAPTER 1: INTRODUCTION", bold: true, size: 32, font: "Times New Roman" })] }),

      para("This chapter presents the background to the development of the Final Year Project Management System. It begins by establishing the context of the research, before identifying the problems that motivate the project and outlining the objectives, scope, and significance of the proposed system. The chapter then closes with a brief summary of the points discussed."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.1  Background of Study", bold: true, size: 28, font: "Times New Roman" })] }),
      para("Within the context of higher education, the Final Year Project (FYP) is a mandatory undertaking that students must complete in order to demonstrate how effectively they can apply the knowledge acquired over the course of their studies (Abdul Halim et al., 2014). It represents the culmination of a student's academic journey and challenges their ability to integrate skills, knowledge, and a scientific attitude in addressing a substantial problem (Mudmainna, 2025). Because the FYP serves as a final measure of intellectual independence and professional readiness, its successful completion carries considerable weight for both the student and the awarding institution."),
      para("The Final Year Project typically consists of several phases, including the submission of a proposal, the assignment of a supervisor, the monitoring of progress, evaluation, and final assessment. Each of these phases demands careful coordination among students, supervisors, and coordinators, which makes the administrative burden of the FYP noticeably heavier than that of ordinary coursework. Nonetheless, the difficulties that students experience during this process are also shaped by a range of internal factors, such as limited research experience and challenges in selecting a suitable topic (Mudmainna, 2025). When the supporting administrative process is fragmented, these difficulties are compounded rather than relieved."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.2  Problem Statement", bold: true, size: 28, font: "Times New Roman" })] }),
      para("The current Final Year Project management process faces several inefficiencies because of its reliance on manual and fragmented systems. Supervisors and students depend on spreadsheets, paper records, emails, and shared drives to manage submissions, which makes it difficult to track updates in a systematic manner (Haris et al., 2025). Without an integrated approach to managing the FYP, students often struggle to find supervisors whose academic expertise aligns with their chosen research area (Haris et al., 2025). The use of everyday messaging applications for academic communication further creates security risks and prevents FYP coordinators from properly monitoring official records, since these records are not stored in a centralised location (Affandi et al., 2022)."),
      para("A second and equally important difficulty concerns the way supervisors are selected. Students frequently lack knowledge of the different fields of study and the experience of the available supervisors, and tend to be familiar only with lecturers who have previously taught them. This limited awareness narrows their decision, as they may believe that only a very small number of potential supervisors and research ideas are available to them. Studies of FYP allocation have shown that supervisor-centred or informal selection mechanisms, in which matching depends on personal acquaintance or subjective judgement, raise concerns about fairness and efficiency, whereas making the full range of projects and supervisors visible to students through a shared platform improves transparency and academic performance (Tang et al., 2024). Similar work on supervisor assignment confirms that informal matching produces uneven supervisor workloads and weak alignment between a project's requirements and a supervisor's expertise (Ramotsisi et al., 2022). The consequence of poor matching is not merely administrative: a preliminary study of supervision relationships found a clear mismatch between the expectations and expertise of students and those of their supervisors, which can undermine the quality of the supervisory relationship from the outset (Mohd Noor et al., 2023)."),
      para("Taken together, these problems indicate a need for a centralised platform that not only manages FYP activities but also assists students in identifying supervisors whose expertise genuinely matches their research interests, rather than leaving this critical decision to chance or limited personal familiarity."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.3  Project Objectives", bold: true, size: 28, font: "Times New Roman" })] }),
      para("In order to address the issues identified in the existing FYP management process, this project focuses on the development of a Final Year Project Management System that centralises all activities involving students, supervisors, and coordinators. The specific objectives are as follows:"),
      bullet("To identify a suitable Natural Language Processing (NLP) approach for semantically matching student project descriptions with supervisor expertise profiles."),
      bullet("To develop an integrated online platform for managing the FYP that incorporates the NLP-based supervisor matching system."),
      bullet("To evaluate the functionality and usability of the system."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.4  Scope of Study", bold: true, size: 28, font: "Times New Roman" })] }),
      para("This project centres on the creation of a web-based Final Year Project Management System intended for use within a single higher education institution. The users who will primarily interact with the system are students, supervisors, and FYP coordinators. The system allows students to submit project proposals, progress reports, and final documents, and it allows supervisors to review submissions, provide comments, and conduct evaluations online. Coordinators are provided with supervisor allocation, progress monitoring, and report generation features that give them oversight of the entire process."),
      para("The present research is confined to a web-based implementation so that the system can be accessed across a broad variety of devices, including desktops, laptops, and tablets. These boundaries are stated explicitly to ensure that the project remains feasible within the available time and resources, and a native mobile application is therefore considered to be outside the scope of this work."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.5  Significance of Study", bold: true, size: 28, font: "Times New Roman" })] }),
      para("The proposed FYP Management System offers several notable benefits. From an academic standpoint, it helps to improve the effectiveness of project monitoring and evaluation by reducing administrative redundancy and consolidating records that would otherwise be scattered across several tools. For students, it provides a smoother experience when submitting project work, which helps to remove ambiguity and contributes to reducing late submissions. For supervisors, the task of monitoring students and managing feedback is simplified through a consistent and well-organised process. For coordinators, the system offers a visualisation feature that supports the tracking of all projects currently underway."),
      para("More distinctively, the integration of NLP-based supervisor matching means that the system contributes not only to administrative efficiency but also to the quality of the academic pairing itself, by helping students discover supervisors whose expertise aligns with their research interests. In summary, the significance of this study lies in its contribution to the digitisation of academic processes, since it provides a practical model of academic workflow management that is useful within a multifaceted institution serving many different users."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "1.6  Summary", bold: true, size: 28, font: "Times New Roman" })] }),
      para("This chapter has established the background and motivation behind the Final Year Project Management System with an integrated NLP-based supervisor matching feature. The limitations of existing FYP management practices were identified, particularly the difficulty that students face in finding supervisors suited to their research area. The project objectives were then defined around addressing these gaps through a centralised, web-based platform, and the scope and significance of the study were discussed. The next chapter reviews the relevant literature and examines the techniques and existing systems that inform the design of the proposed solution."),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════ CHAPTER 2 ══════════════════
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "CHAPTER 2: LITERATURE REVIEW", bold: true, size: 32, font: "Times New Roman" })] }),

      para("This chapter begins with an explanation and contextualisation of the key terms and concepts contained in the project title. It then discusses the motivation for, and the need behind, the proposed system, drawing on the documented deficiencies in existing FYP management practices. An overview of the NLP methods suitable for the supervisor matching problem is also carried out, before three existing systems are examined and compared in order to identify the gap that the proposed system seeks to fill."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.1  Final Year Project (FYP)", bold: true, size: 28, font: "Times New Roman" })] }),
      para("Undergraduate students in most universities and colleges are required to complete a Final Year Project (FYP) during the final year of their studies. The FYP marks the culmination of a student's academic journey, in which the theoretical knowledge gained throughout the programme must be applied to solve a practical problem or to provide new insight into the student's field (Abdul Halim et al., 2014). It requires students to bring together their skills, knowledge, and scientific attitude, and it therefore serves simultaneously as a measure of intellectual independence and of professional preparedness (Mudmainna, 2025)."),
      para("The learning value of the FYP extends beyond the individual student. Institutions have come to treat FYP outcomes as indicators of the quality of their academic programmes, and the administration of the FYP is consequently an institutional concern rather than a purely personal one. Where the assignment of supervision and the monitoring of progress are deficient, the effects may extend to academic standards and overall achievement levels (Mudmainna, 2025). A well-managed FYP process is thus important not only for individual success but also for institutional accountability."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.2  Project Management System", bold: true, size: 28, font: "Times New Roman" })] }),
      para("A project management system (PMS) is a software-based application or platform used to plan, organise, execute, monitor, and control the activities of a project in a structured and transparent manner. From an academic perspective, a management information system (MIS) can be understood as a broad category of systems that support institutional decision-making by gathering and processing data drawn from a range of administrative functions; in higher education, the effectiveness of such systems has been shown to improve the quality of decisions made by administrators (Al-Husseini, 2024). A Final Year Project Management System (FYPMS) is a dedicated form of project management system designed to manage academic capstone projects, with features for document submission, progress tracking, communication, and the recording of evaluation outcomes."),
      para("In addition to improving efficiency, a well-designed FYP management system documents academic output as part of the institutional record. Fragmented manual submissions and scattered evaluation data cannot easily be used for programme quality assurance, accreditation, or trend analysis across cohorts, whereas digitised data lends itself naturally to these purposes (Affandi et al., 2022). The value of a FYPMS therefore lies not only in day-to-day convenience but also in the longer-term reuse of the data it captures."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.3  Natural Language Processing (NLP)", bold: true, size: 28, font: "Times New Roman" })] }),
      para("Natural Language Processing (NLP) is a branch of artificial intelligence (AI) concerned with enabling computers to understand, interpret, and generate human language in a meaningful and contextually appropriate manner (Hirschberg & Manning, 2015). NLP encompasses a wide range of activities, including text classification, sentiment analysis, machine translation, named entity recognition, information extraction, and the computation of semantic similarity. These capabilities allow NLP systems to derive structured understanding from the unstructured text that forms the bulk of the information created in human communication."),
      para("Within the proposed FYP Management System, NLP provides the technological foundation of the supervisor matching module. In particular, NLP is used to produce a semantic similarity score for analysing free-text student project descriptions against supervisor expertise profiles, thereby quantifying how closely the research background of a student corresponds to that of a supervisor. In doing so, it transforms what was previously a subjective and manual task into a process that is data-driven, scalable, and repeatable, and that can be applied consistently across an entire cohort rather than relying on the personal knowledge of any single coordinator."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.4  Semantic Similarity", bold: true, size: 28, font: "Times New Roman" })] }),
      para("Semantic similarity is a measure of how alike two pieces of text are in meaning, regardless of whether they share the same words (Reimers & Gurevych, 2019). It is therefore distinct from lexical or syntactic similarity, which is based on the overlap of strings of characters. Semantic similarity captures not only conceptual equivalence and synonymy but also contextual relatedness; for example, it can recognise that two documents are closely related even when a phrase such as \u201Cmachine learning\u201D does not appear in both of them."),
      para("Semantic similarity between two pieces of text is generally computed by embedding them within a high-dimensional vector space and then measuring the geometric relationship between the resulting vectors. The most widely used measure for this purpose is the cosine similarity function, which returns a score ranging from \u22121 to 1, where 1 represents perfect alignment, 0 represents no relationship, and \u22121 represents opposition (Reimers & Gurevych, 2019). The evaluation of sentence embeddings produced by transformer-based models has shown that the geometry of this vector space corresponds closely to human judgements of meaning, which supports the use of cosine similarity as a reliable indicator of semantic relatedness (Alsuhaibani, 2025)."),
      para("The usefulness of semantic similarity has been demonstrated across several domains of academic and professional matching. In recruitment, AI platforms that rely on semantic similarity have been shown to outperform keyword-based methods by interpreting the meaning behind job descriptions rather than merely the words they contain; in one framework, semantic matching produced markedly higher similarity scores than keyword matching across diverse job domains (Ajjam & Al-Raweshidy, 2025). Comparable results have been reported in academic recommendation tasks, where sentence-embedding models have been used to match scholarly material with appropriate targets more accurately than lexical baselines (Colangelo et al., 2025)."),
      para("In the FYP context, semantic similarity provides the mathematical structure for comparing a student's project description with each supervisor's expertise profile. Students can then be presented with a rank-ordered list of supervisors, sorted according to the similarity between their research interests and the expertise of each supervisor, so that the most relevant recommendations appear first."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.5  NLP Techniques for Supervisor Matching", bold: true, size: 28, font: "Times New Roman" })] }),
      para("The proposed system uses NLP to compute the semantic similarity between a student's project description and a supervisor's expertise profile. Several NLP techniques are suitable for this task, each presenting its own advantages and disadvantages with respect to semantic expressiveness, computational cost, and implementation complexity. Three widely used approaches are examined here: TF-IDF with cosine similarity, Word2Vec and Doc2Vec, and Sentence-BERT (sentence transformers)."),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: "2.5.1  TF-IDF with Cosine Similarity", bold: true, size: 25, font: "Times New Roman" })] }),
      para("Term Frequency\u2013Inverse Document Frequency (TF-IDF) is a classic NLP technique that assigns a numerical weight to every word in a document according to how often the word occurs in that document relative to how often it occurs across the entire collection of documents (Manning et al., 2008). A high TF-IDF score identifies words that are specific to a given document and comparatively rare elsewhere, and therefore more informative. Once documents have been represented as TF-IDF weighted vectors, the similarity between any two of them can be measured using cosine similarity."),
      para("TF-IDF is simple, easy to implement, and easy to interpret, and it performs well on similarity tasks involving relatively small or medium-sized collections of text. It is, however, fundamentally a lexical technique that disregards the meaning of words and the semantic relationships between them, treating each word as an independent unit. As a result, it cannot relate synonyms to one another or recognise that different documents describe the same concept using different vocabulary (Xiao et al., 2024). This is a serious drawback in the context of supervisor matching, where a student's project description and a supervisor's research profile may describe closely related research areas using entirely different terms."),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: "2.5.2  Word2Vec and Doc2Vec", bold: true, size: 25, font: "Times New Roman" })] }),
      para("Word2Vec is a neural network model that learns dense vector representations, or embeddings, of words based on their distributional context\u2014that is, the words that tend to occur alongside them in a large corpus of text (Mikolov et al., 2013). These embeddings capture semantic relationships between words by assigning geometrically similar vectors to words that appear in similar contexts, which allows the model to infer synonymy, analogy, and broader semantic relatedness. Doc2Vec extends this approach to produce fixed-length embeddings for entire documents or paragraphs rather than for individual words (Le & Mikolov, 2014)."),
      para("In the context of supervisor matching, Doc2Vec can represent both student project descriptions and supervisor expertise profiles as comparable vectors, whose similarity can then be quantified using cosine similarity. This family of methods has been shown to capture the semantic relationships between terms more effectively than TF-IDF; in research on expert information extraction, for instance, a Word2Vec-based embedding method produced significantly better matching performance than a TF-IDF approach (Yang et al., 2026). A limitation of Word2Vec and Doc2Vec, however, is that their embeddings are static, meaning that each word is associated with a single fixed representation. This makes them poorly suited to handling polysemous words\u2014words that carry different meanings in different contexts\u2014and limits their ability to capture the finer nuances of domain-specific academic language."),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: "2.5.3  Sentence-BERT (Sentence Transformers)", bold: true, size: 25, font: "Times New Roman" })] }),
      para("Sentence-BERT (SBERT) is an adaptation of the BERT model that uses siamese and triplet network structures to generate semantically meaningful, fixed-length, sentence-level embedding vectors (Reimers & Gurevych, 2019). Rather than relying on the original BERT model, which would need to encode both input documents together in a single forward pass\u2014an operation that becomes prohibitively expensive when a database contains many documents\u2014SBERT represents each document with a single embedding vector that can be pre-computed and stored. Efficient large-scale similarity comparisons between any two texts then become possible simply by computing the cosine similarity of their stored embedding vectors."),
      para("SBERT builds upon the bidirectional transformer architecture of BERT, which was pre-trained on a very large body of text using masked language modelling and next-sentence prediction objectives (Devlin et al., 2019). Through this pre-training, SBERT acquires a strong contextual understanding of language, producing embeddings that preserve the semantic equivalence of descriptions that express the same concept in different words. In a comparative study of sentence transformer models used to collect reference papers across five academic fields, sentence-transformer approaches achieved strong performance in matching documents with semantically similar content, surpassing more traditional lexical and word-level methods (Fahrudin et al., 2025). The principal drawback of SBERT is that it is less computationally efficient than simpler methods, since the underlying transformer model requires considerably more memory and processing power per encoding."),

      caption("Table 2.1  Comparison of NLP Techniques for Supervisor Matching"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2126, 2300, 2300, 2300],
        rows: [
          new TableRow({ tableHeader: true, children: [
            tcell("", { width: 2126, shading: headerShading, bold: true, color: "FFFFFF" }),
            tcell("TF-IDF + Cosine Similarity", { width: 2300, shading: headerShading, bold: true, color: "FFFFFF" }),
            tcell("Word2Vec / Doc2Vec", { width: 2300, shading: headerShading, bold: true, color: "FFFFFF" }),
            tcell("Sentence-BERT (SBERT)", { width: 2300, shading: headerShading, bold: true, color: "FFFFFF" }),
          ]}),
          ...[
            ["Reference", "Manning et al. (2008); Xiao et al. (2024)", "Mikolov et al. (2013); Le & Mikolov (2014)", "Reimers & Gurevych (2019)"],
            ["Text Representation", "Sparse vector (keyword frequency weights)", "Dense vector (word-level distributional embeddings)", "Dense vector (contextual sentence-level embeddings)"],
            ["Semantic Understanding", "Low \u2014 lexical overlap only; no meaning captured", "Medium \u2014 distributional semantics; word-level relations", "High \u2014 deep contextual semantics at sentence level"],
            ["Context Awareness", "None \u2014 words treated as independent tokens", "None \u2014 static, context-independent embeddings", "High \u2014 bidirectional transformer context encoding"],
            ["Synonym / Paraphrase Handling", "Poor \u2014 synonyms treated as unrelated terms", "Good \u2014 similar words cluster in embedding space", "Excellent \u2014 recognises paraphrases and equivalence"],
            ["Computational Cost", "Low \u2014 fast vectorisation and comparison", "Medium \u2014 requires neural network training", "Higher \u2014 transformer inference required per encoding"],
            ["Matching Accuracy", "Low to Medium", "Medium", "High \u2014 state of the art on similarity benchmarks"],
            ["Pre-training Required", "No \u2014 computed directly from the corpus", "Yes \u2014 requires domain text corpus for training", "Yes \u2014 general pre-trained models publicly available"],
            ["Suitability for This Project", "Not recommended \u2014 misses semantic alignment", "Moderate \u2014 limited by static, context-free embeddings", "Best suited \u2014 highest accuracy for semantic matching"],
          ].map((row, ri) => new TableRow({ children: [
            tcell(row[0], { width: 2126, shading: altShading, bold: true }),
            tcell(row[1], { width: 2300, shading: ri % 2 === 1 ? altShading : undefined }),
            tcell(row[2], { width: 2300, shading: ri % 2 === 1 ? altShading : undefined }),
            tcell(row[3], { width: 2300, shading: ri % 2 === 1 ? altShading : undefined }),
          ]}))
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: "2.5.4  Chosen Technique: Sentence-BERT", bold: true, size: 25, font: "Times New Roman" })] }),
      para("Sentence-BERT is chosen as the NLP technique for the proposed supervisor matching module. Academic research is characterised by domain-specific terms and phrases that can express very similar concepts in markedly different ways; a student might describe their work as \u201Cdeep learning for medical image analysis\u201D, while a supervisor describes the same area as \u201Cconvolutional neural networks in clinical imaging\u201D. TF-IDF would fail to match these descriptions because they share no keywords, and although Word2Vec would capture some degree of similarity, it cannot fully represent the context of a multi-word academic description."),
      para("As demonstrated on semantic textual similarity benchmarks (Reimers & Gurevych, 2019), the contextual, sentence-level embeddings produced by SBERT yield the most reliable similarity scores. The availability of high-quality pre-trained SBERT models, such as all-MiniLM-L6-v2 and paraphrase-mpnet-base-v2, which can be deployed easily through the SentenceTransformers Python library, means that SBERT can be adopted without the need to build a large domain-specific training corpus. In this setting, the additional computational cost of SBERT is not significant, since matching computations are performed only when a proposal is submitted, and the number of supervisors in a typical institution is small enough for the comparison to be carried out efficiently."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.6  Similar Existing Works", bold: true, size: 28, font: "Times New Roman" })] }),
      para("This section reviews three existing systems in order to understand the problem area of FYP management and supervisor matching. Each system is examined in terms of its main focus, its target users, its principal features, and its limitations, so as to identify the gap that the proposed system addresses."),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: "2.6.1  Recommendation System to Propose Final Project Supervisors using Cosine Similarity Matrix (Falah & Suryawan, 2022)", bold: true, size: 25, font: "Times New Roman" })] }),
      para("Falah and Suryawan (2022) developed a web-based recommendation system, published in Khazanah Informatika: Jurnal Ilmu Komputer dan Informatika, that recommends the most suitable supervisor for a student's final project proposal. The system uses a content-based filtering method to construct an expertise profile for each supervisor by extracting the titles, abstracts, and keywords from each lecturer's Google Scholar profile page. This information forms a knowledge base that reflects each supervisor's research interests. When a student proposes a project topic, cosine similarity is computed between the text of the student's proposal and the aggregated publication data of all supervisors, producing a ranked list of suggested matches."),
      para("Because the matching was performed at the keyword level using standard cosine similarity over TF-IDF term vectors, the system was unable to capture the semantic meaning of the text perfectly, a limitation that the authors themselves acknowledged. Furthermore, although the system is web-based, it is not integrated with the wider range of FYP lifecycle management capabilities, such as submission tracking, progress monitoring, meeting scheduling, or coordinator oversight, and therefore functions only as a standalone recommendation tool."),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: "2.6.2  Prototype Development of a Final Year Project Management System (Isa et al., 2024)", bold: true, size: 25, font: "Times New Roman" })] }),
      para("Isa et al. (2024) developed a web-based FYP Management System at Universiti Poly-Tech Malaysia (KUPTM) in order to tackle the inefficiency of paper-based project tracking. The system is built around a dashboard concept that allows students to view their own project progress at any time and enables lecturers to monitor the performance of all of their supervisees from a single location. It serves students, lecturers, and coordinators, and it consolidates documentation that had previously been managed in physical logbooks and arranged through manual scheduling. The authors note that manual monitoring has become increasingly unsustainable as the number of students supervised by a single lecturer continues to grow (Isa et al., 2024). The system does not, however, include any supervisor matching capability, since the allocation of supervisors remains a manual responsibility of the coordinator."),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: "2.6.3  FYPHub: An Integrated FYP Management Platform (Haris et al., 2025)", bold: true, size: 25, font: "Times New Roman" })] }),
      para("FYPHub, developed by Haris et al. (2025) at Universiti Kuala Lumpur MIIT, is a comprehensive FYP management platform built using the Rapid Application Development (RAD) methodology. The system supports end-to-end FYP administration for several user groups, including the submission of FYP proposals, the provision of supervisors' comments, the tracking of FYP milestones, the grading of projects, and the consolidation of project documents. A centralised dashboard additionally provides lecturers and supervisors with real-time visibility of student progress through the various stages of the project, from the proposal defence to the submission of the final report, allowing them to monitor progress at a project-wide level. As with the previous system, however, FYPHub does not provide any automated supervisor matching, and the pairing of students with supervisors remains a manual process."),

      caption("Table 2.2  Comparison of Similar Existing Works"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1826, 2400, 2400, 2400],
        rows: [
          new TableRow({ tableHeader: true, children: [
            tcell("Feature / Aspect", { width: 1826, shading: headerShading, bold: true, color: "FFFFFF" }),
            tcell("Falah & Suryawan (2022)", { width: 2400, shading: headerShading, bold: true, color: "FFFFFF" }),
            tcell("Isa et al. (2024)", { width: 2400, shading: headerShading, bold: true, color: "FFFFFF" }),
            tcell("FYPHub (Haris et al., 2025)", { width: 2400, shading: headerShading, bold: true, color: "FFFFFF" }),
          ]}),
          ...[
            ["Primary Focus", "Supervisor recommendation via cosine similarity on Google Scholar data", "FYP progress monitoring and submission management", "End-to-end FYP administration and evaluation management"],
            ["Supervisor Matching", "Yes \u2014 TF-IDF cosine similarity on scraped publications", "No \u2014 manual allocation by coordinator", "No \u2014 manual allocation by coordinator"],
            ["NLP-Based Matching", "None \u2014 keyword-level TF-IDF only; cannot handle semantic gaps", "No", "No"],
            ["Integration Level", "Standalone supervisor recommendation system", "Standalone FYPMS; no matching functionality", "Integrated FYPMS; no matching functionality"],
            ["Key Limitation", "Keyword-level matching only; no semantic understanding; no FYP management features", "No supervisor matching functionality", "No supervisor matching functionality"],
          ].map((row, ri) => new TableRow({ children: [
            tcell(row[0], { width: 1826, shading: altShading, bold: true }),
            tcell(row[1], { width: 2400, shading: ri % 2 === 1 ? altShading : undefined }),
            tcell(row[2], { width: 2400, shading: ri % 2 === 1 ? altShading : undefined }),
            tcell(row[3], { width: 2400, shading: ri % 2 === 1 ? altShading : undefined }),
          ]}))
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: "2.6.4  Differentiation of the Proposed System", bold: true, size: 25, font: "Times New Roman" })] }),
      para("The proposed FYP Management System differs from all three of the reviewed systems in two important respects. First, it is the only system that connects NLP-based supervisor matching directly with a full-featured FYP management platform. Falah and Suryawan (2022) addressed the matching problem, but their solution did not use NLP and was not integrated into any management workflow. Conversely, the centralised management platforms developed by Isa et al. (2024) and the FYPHub platform (Haris et al., 2025) provide comprehensive administrative features but do not address the research matching problem at all."),
      para("Second, the proposed system advances beyond the work of Falah and Suryawan (2022), which relies on TF-IDF cosine similarity, by using SBERT sentence embeddings to encode semantic meaning at the sentence level. This allows the proposed system to match a student's proposal to a supervisor whose competency is semantically similar even when it is not expressed in identical terms. By integrating this recommendation capability into an end-to-end FYP management platform, the proposed system offers a combination of features that none of the three reviewed systems currently provides."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.7  Summary", bold: true, size: 28, font: "Times New Roman" })] }),
      para("This chapter has examined the literature relevant to the development of a centralised FYP Management System with integrated NLP-based supervisor matching. The Final Year Project was defined and contextualised, alongside other key concepts such as project management systems, Natural Language Processing, and semantic similarity, with reference to recent academic work. Three NLP techniques\u2014TF-IDF with cosine similarity, Word2Vec and Doc2Vec, and Sentence-BERT\u2014were then compared, and Sentence-BERT was selected as the most suitable technique for the supervisor matching module on the grounds of its superior ability to capture semantic meaning. Finally, three existing systems were reviewed and compared, and the analysis demonstrated that the proposed system uniquely combines comprehensive FYP lifecycle management with semantic supervisor matching, a combination that is not found in any single existing solution."),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════ REFERENCES ══════════════════
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "REFERENCES", bold: true, size: 32, font: "Times New Roman" })] }),

      refPara([{ text: "Abdul Halim, M. H., Buniyamin, N., Imazawa, A., Naoe, N., & Ito, M. (2014). The role of Final Year Project and Capstone Project in undergraduate engineering education in Malaysia and Japan. In " }, { text: "2014 IEEE 6th Conference on Engineering Education (ICEED)", italics: true }, { text: " (pp. 1\u20136). IEEE. " }, link("https://doi.org/10.1109/ICEED.2014.7194678")]),
      refPara([{ text: "Affandi, R., Bee, T. C., & Baharom, A. (2022). Development of the mobile application for Final Year Project (FYP) management system. " }, { text: "International Journal of Education and Pedagogy, 4", italics: true }, { text: "(3), 165\u2013176." }]),
      refPara([{ text: "Ajjam, M.-H., & Al-Raweshidy, H. S. (2025). AI-driven semantic similarity-based job matching framework for recruitment systems. " }, { text: "Information Sciences, 724", italics: true }, { text: ", Article 122728. " }, link("https://doi.org/10.1016/j.ins.2025.122728")]),
      refPara([{ text: "Al-Husseini, Y. (2024). The impact of management information systems (MIS) effectiveness on improving the decision-making process in higher education institutions in the Sultanate of Oman. " }, { text: "The Arab Journal of Administration, 44", italics: true }, { text: "(4), 17\u201332. " }, link("https://doi.org/10.21608/aja.2021.82321.1111")]),
      refPara([{ text: "Alsuhaibani, M. (2025). The geometry of meaning: Evaluating sentence embeddings from diverse transformer-based models for natural language inference. " }, { text: "PeerJ Computer Science, 11", italics: true }, { text: ", Article e2957. " }, link("https://doi.org/10.7717/peerj-cs.2957")]),
      refPara([{ text: "Colangelo, M. T., Meleti, M., Guizzardi, S., Calciolari, E., & Galli, C. (2025). A comparative analysis of sentence transformer models for automated journal recommendation using PubMed metadata. " }, { text: "Big Data and Cognitive Computing, 9", italics: true }, { text: "(3), Article 67. " }, link("https://doi.org/10.3390/bdcc9030067")]),
      refPara([{ text: "Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of deep bidirectional transformers for language understanding. In " }, { text: "Proceedings of NAACL-HLT 2019", italics: true }, { text: " (pp. 4171\u20134186). " }, link("https://doi.org/10.18653/v1/N19-1423")]),
      refPara([{ text: "Fahrudin, T. M., Funabiki, N., Brata, K. C., Noprianto, Muhaimin, A., & Hindrayani, K. M. (2025). Comparative analysis of sentence transformers for reference paper collection in five academic fields. In " }, { text: "Proceedings of the 2025 8th International Conference on Computational Intelligence and Intelligent Systems (CIIS \u201925)", italics: true }, { text: ". ACM. " }, link("https://doi.org/10.1145/3787256.3787277")]),
      refPara([{ text: "Falah, Z. F., & Suryawan, F. (2022). Recommendation system to propose final project supervisors using cosine similarity matrix. " }, { text: "Khazanah Informatika: Jurnal Ilmu Komputer dan Informatika, 8", italics: true }, { text: "(2). " }, link("https://doi.org/10.23917/khif.v8i2.16235")]),
      refPara([{ text: "Haris, N. A., Abdullah Zailani, N., Hasim, N., & Abdul Rahman, F. (2025). An integrated approach to supervising and managing students\u2019 final year projects in higher institutions. " }, { text: "International Journal of Computational Thinking and Data Science, 5", italics: true }, { text: "(1), 19\u201327. " }, link("https://doi.org/10.37934/ctds.5.1.1927")]),
      refPara([{ text: "Hirschberg, J., & Manning, C. D. (2015). Advances in natural language processing. " }, { text: "Science, 349", italics: true }, { text: "(6245), 261\u2013266. " }, link("https://doi.org/10.1126/science.aaa8685")]),
      refPara([{ text: "Isa, R., Othman, S., Ali, A. S., Azizan, N., & Ferguson, J. (2024). Prototype development of final year project management system to monitor student\u2019s performance. " }, { text: "Journal of Advanced Research in Applied Sciences and Engineering Technology, 40", italics: true }, { text: "(1), 164\u2013173." }]),
      refPara([{ text: "Le, Q., & Mikolov, T. (2014). Distributed representations of sentences and documents. In " }, { text: "Proceedings of the 31st International Conference on Machine Learning", italics: true }, { text: " (PMLR Vol. 32, Issue 2, pp. 1188\u20131196)." }]),
      refPara([{ text: "Manning, C. D., Raghavan, P., & Sch\u00FCtze, H. (2008). " }, { text: "Introduction to information retrieval", italics: true }, { text: ". Cambridge University Press." }]),
      refPara([{ text: "Mikolov, T., Chen, K., Corrado, G., & Dean, J. (2013). " }, { text: "Efficient estimation of word representations in vector space", italics: true }, { text: ". arXiv. " }, link("https://doi.org/10.48550/arXiv.1301.3781")]),
      refPara([{ text: "Mohd Noor, M., Turiman, S., Suppiah, P. C., Sankaran Nair, S. S. K., & Aziz Hussin, A. (2023). Undergraduate final year project supervision: A preliminary study of supervisee\u2013supervisor\u2019s expectations. " }, { text: "International Journal of Academic Research in Progressive Education and Development, 12", italics: true }, { text: "(3). " }, link("https://doi.org/10.6007/IJARPED/v12-i3/18863")]),
      refPara([{ text: "Mudmainna. (2025). Analysis of students\u2019 difficulties in completing final projects. " }, { text: "Journal La Edusci, 6", italics: true }, { text: "(4), 816\u2013839. " }, link("https://doi.org/10.37899/journallaedusci.v6i4.2633")]),
      refPara([{ text: "Ramotsisi, J., Kgomotso, M., Seboni, L., & Salahi, M. (2022). An optimization model for the student-to-project supervisor assignment problem\u2014The case of an engineering department. " }, { text: "Journal of Optimization, 2022", italics: true }, { text: ", Article 9415210. " }, link("https://doi.org/10.1155/2022/9415210")]),
      refPara([{ text: "Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence embeddings using Siamese BERT-networks. In " }, { text: "Proceedings of EMNLP-IJCNLP 2019", italics: true }, { text: " (pp. 3982\u20133992). " }, link("https://doi.org/10.18653/v1/D19-1410")]),
      refPara([{ text: "Tang, Y., Liu, X., & Zhao, J. (2024). Navigating the uncertainty: The impact of a student-centered final year project allocation mechanism on student performance. " }, { text: "Humanities and Social Sciences Communications, 11", italics: true }, { text: ", Article 776. " }, link("https://doi.org/10.1057/s41599-024-03324-7")]),
      refPara([{ text: "Xiao, L., Li, Q., Ma, Q., Shen, J., Yang, Y., & Li, D. (2024). Text classification algorithm of tourist attractions subcategories with modified TF-IDF and Word2Vec. " }, { text: "PLOS ONE, 19", italics: true }, { text: "(10), Article e0305095. " }, link("https://doi.org/10.1371/journal.pone.0305095")]),
      refPara([{ text: "Yang, T., Li, C., & Li, L. (2026). Research on expert information extraction based on Word2Vec and improved Transformer. " }, { text: "AIMS Electronics and Electrical Engineering, 10", italics: true }, { text: "(1), 54\u201370. " }, link("https://doi.org/10.3934/electreng.2026003")]),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/user-data/outputs/FYP_Chapter_1-2_Rewritten.docx", buffer);
  console.log("Done.");
});