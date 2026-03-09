import type { DocumentAnalysis } from "./analysisTypes";

export function generateMockAnalysis(documentName: string): DocumentAnalysis {
  return {
    summary: `This document "${documentName}" outlines a comprehensive legislative framework addressing key governance areas. It introduces new regulatory mechanisms, establishes oversight bodies, and defines citizen rights and obligations. The bill spans multiple sectors including public administration, digital governance, and fiscal policy, aiming to modernize existing legal structures while ensuring public accountability.`,
    keyHighlights: [
      "Establishes a new independent regulatory authority with oversight powers",
      "Introduces digital identity verification for all government services",
      "Mandates transparency in public procurement processes",
      "Creates a citizen grievance redressal mechanism with 30-day response guarantee",
      "Allocates 2% of GDP towards digital infrastructure development",
      "Introduces penalties for non-compliance by government officials",
    ],
    importantClauses: [
      {
        title: "Section 12: Right to Information Access",
        explanation: "Every citizen has the right to request and receive information about government decisions that affect them, within 15 working days of the request.",
      },
      {
        title: "Section 24: Digital Service Mandate",
        explanation: "All government services must be available online within 2 years. Physical offices will continue to operate for citizens without internet access.",
      },
      {
        title: "Section 37: Accountability Framework",
        explanation: "Government officials who fail to respond to citizen queries within the mandated timeframe face disciplinary action and potential fines.",
      },
      {
        title: "Section 45: Data Protection",
        explanation: "Citizens' personal data collected by government agencies must be encrypted, stored securely, and cannot be shared with third parties without explicit consent.",
      },
    ],
    citizenImpact: `**What This Law Means For You:**\n\n• **Faster Services:** Government services will be available online, reducing wait times and the need to visit offices in person.\n\n• **More Transparency:** You'll have the right to know how government decisions are made and how public money is spent.\n\n• **Better Accountability:** Officials must respond to your complaints within 30 days, or face consequences.\n\n• **Data Safety:** Your personal information will be better protected when dealing with government agencies.\n\n• **Equal Access:** Even without internet, you can still access all services through physical offices.\n\nOverall, this law aims to make government more responsive, transparent, and citizen-friendly.`,
    faq: [
      {
        question: "When does this law come into effect?",
        answer: "The law will come into effect 90 days after receiving presidential assent, with a phased implementation over 2 years for digital services.",
      },
      {
        question: "Do I need to do anything as a citizen?",
        answer: "No immediate action is required. Over time, you may need to register for a digital identity to access online government services.",
      },
      {
        question: "What if I don't have internet access?",
        answer: "Physical government offices will continue to operate. The law specifically mandates that offline access must remain available.",
      },
      {
        question: "How can I file a complaint under this law?",
        answer: "You can file complaints through the new online portal, by phone, or in person at any government office. A response is guaranteed within 30 days.",
      },
      {
        question: "Does this affect private businesses?",
        answer: "Private businesses that contract with the government must comply with the transparency and data protection provisions of this law.",
      },
    ],
    simplifiedSummary: `Think of this law like updating the rules for how the government works with people. Right now, getting things done with the government can be slow and confusing. This new law says: "Let's make it simpler." It puts everything online (like ordering food on an app, but for government paperwork), makes sure officials actually answer when you ask them something, and keeps your personal information safe. If they don't follow the rules, they get in trouble — just like anyone else would.`,
  };
}
