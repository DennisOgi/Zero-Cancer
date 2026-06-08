export type ReportTemplateKey = {
  category: "CERVICAL_CANCER";
  testType: "HPV_TESTING";
  subTest: "ONCOPROTEINS";
  outcome: "POSITIVE" | "NEGATIVE";
};

export type ReportTemplateContent = {
  title: string;
  sampleType: string;
  resultText: string;
  interpretation: string;
  advise: string;
  remarks: string;
  disclaimer: string;
};

const ONCOPROTEINS_NEGATIVE: ReportTemplateContent = {
  title: "HPV TESTING FOR ONCOPROTEINS USING MOBILAB RAPID TEST DEVICE",
  sampleType: "Cervical swab/lavage",
  resultText: "Negative",
  interpretation:
    "Patient has no active expression of oncoproteins E6/E7 of HPV",
  advise: "1. Repeat HPV test after 5 years\n2. Receive HPV vaccination",
  remarks:
    "Mobilab Rapid Test kits detects biomarkers of oncogenic high risk HPV in form of Oncoproteins E6/E7 through lateral flow chromatography of embedded immunofluorescent antibodies which react with oncoproteins to indicate presence of HPV.",
  disclaimer:
    "The absence of oncoproteins of HPV does not indicate there is no HPV infection.",
};

const ONCOPROTEINS_POSITIVE: ReportTemplateContent = {
  title: "HPV TESTING FOR ONCOPROTEINS USING MOBILAB RAPID TEST DEVICE",
  sampleType: "Cervical swab/lavage",
  resultText: "Positive",
  interpretation:
    "Patient has been exposed to high risk oncogenic Human Papilloma Virus with expression of oncoproteins E6/E7",
  advise:
    "1. Refer for colposcopy and treatment if findings indicate\n2. Repeat HPV test after one year",
  remarks:
    "Mobilab Rapid Test kits detects biomarkers of oncogenic high risk HPV in form of Oncoproteins E6/E7 through lateral flow chromatography of embedded immunofluorescent antibodies which react with oncoproteins to indicate presence of HPV.",
  disclaimer:
    "The presence of oncoproteins of HPV does not indicate cervical cancer.",
};

export function getReportTemplate(params: {
  reportCategory: string;
  reportTestType: string;
  reportSubTest?: string | null;
  resultOutcome: "POSITIVE" | "NEGATIVE";
}): ReportTemplateContent | null {
  if (
    params.reportCategory === "CERVICAL_CANCER" &&
    params.reportTestType === "HPV_TESTING" &&
    params.reportSubTest === "ONCOPROTEINS"
  ) {
    return params.resultOutcome === "POSITIVE"
      ? ONCOPROTEINS_POSITIVE
      : ONCOPROTEINS_NEGATIVE;
  }
  return null;
}

export const REPORT_TAXONOMY = [
  {
    id: "CERVICAL_CANCER",
    label: "Cervical Cancer",
    active: true,
    tests: [
      {
        id: "HPV_TESTING",
        label: "HPV Testing",
        active: true,
        subTests: [
          { id: "DNA", label: "DNA", active: false },
          { id: "RNA", label: "RNA", active: false },
          { id: "ONCOPROTEINS", label: "Oncoproteins", active: true },
        ],
      },
      { id: "VIA", label: "Visual Inspection with Acetic Acid", active: false },
      { id: "VILI", label: "Visual Inspection with Lugol's iodine", active: false },
      { id: "PAP_SMEAR", label: "Pap Smear", active: false },
      {
        id: "LIQUID_BASED_CYTOLOGY",
        label: "Liquid based cytology",
        active: false,
      },
      { id: "TRUSCREEN", label: "Truscreen", active: false },
    ],
  },
  { id: "BREAST_CANCER", label: "Breast Cancer", active: false, tests: [] },
  { id: "PROSTATE_CANCER", label: "Prostate Cancer", active: false, tests: [] },
  {
    id: "COLORECTAL_CANCER",
    label: "Colorectal Cancer",
    active: false,
    tests: [],
  },
] as const;
