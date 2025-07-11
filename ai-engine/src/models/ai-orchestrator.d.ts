export interface CompanyProfile {
    name: string;
    businessType: string;
    foundedYear: number;
    employeeCount: number;
    description: string;
    industry: string;
    location: string;
    revenue?: number;
}
export interface SubsidyProgram {
    id: string;
    name: string;
    description: string;
    category: string;
    maxAmount: number;
    eligibilityCriteria: string[];
    applicationDeadline: Date;
    status: 'active' | 'inactive';
}
export interface AIAnalysisInput {
    companyProfile: CompanyProfile;
    projectDescription: string;
    targetMarket: string;
    fundingAmount: number;
}
export interface AIAnalysisResult {
    innovationScore: number;
    marketPotentialScore: number;
    feasibilityScore: number;
    overallScore: number;
    recommendations: string[];
    concerns: string[];
    improvementSuggestions: string[];
}
export interface RecommendationInput {
    companyProfile: CompanyProfile;
    availablePrograms: SubsidyProgram[];
}
export interface ProgramRecommendation {
    program: SubsidyProgram;
    score: number;
    reasoning: string;
    concerns: string[];
    preparationPeriod: string;
}
export interface RecommendationResult {
    recommendations: ProgramRecommendation[];
    totalPrograms: number;
    analyzedAt: Date;
}
export interface ContentGenerationInput {
    sectionType: 'businessPlan' | 'projectDescription' | 'marketAnalysis' | 'budget' | 'timeline';
    companyProfile: CompanyProfile;
    projectDescription?: string;
    additionalContext?: any;
}
export interface GeneratedContent {
    content: string;
    confidence: number;
    suggestions: string[];
}
declare class AIOrchestrator {
    private openaiModel;
    private anthropicModel;
    constructor();
    analyzeBusinessPlan(input: AIAnalysisInput): Promise<AIAnalysisResult>;
    recommendPrograms(input: RecommendationInput): Promise<RecommendationResult>;
    generateContent(input: ContentGenerationInput): Promise<GeneratedContent>;
    private getContentPrompt;
    private parseAnalysisResult;
    private parseRecommendationResult;
    private extractScoreFromText;
    private calculateConfidenceScore;
    private extractSuggestions;
}
export default AIOrchestrator;
//# sourceMappingURL=ai-orchestrator.d.ts.map