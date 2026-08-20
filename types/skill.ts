export type SkillState = "STRONG" | "DEVELOPING" | "WEAK" | "UNCERTAIN";

export interface SkillEstimateDTO {
  conceptId: string;
  conceptName: string;
  proficiency: number;
  evidenceConfidence: number;
  evidenceCount: number;
  state: SkillState;
  difficultyCeiling: number;
  transferVerified: boolean;
  prerequisites?: string[];
}

export interface SkillGraphNodeData {
  id: string;
  name: string;
  state: SkillState;
  proficiency: number;
  evidenceConfidence: number;
  prerequisites: string[];
  importance: number;
}
