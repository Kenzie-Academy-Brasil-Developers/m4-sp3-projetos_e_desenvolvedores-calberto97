export interface iCreateProjectRequest {
  name: string;
  description: string;
  estimatedTime: string;
  repository: string;
  startDate: Date;
  endDate?: Date;
  developerId: number;
}

export type tCreateProjectResult = iCreateProjectRequest & {
  id: number;
};

export type tCreateProjectRequiredKeys =
  | "name"
  | "description"
  | "estimatedTime"
  | "repository"
  | "startDate"
  | "developerId";

export interface iUpdateProjectValidate {
  name?: string;
  description?: string;
  estimatedTime?: string;
  repository?: string;
  startDate?: Date;
  endDate?: Date;
  developerId?: number;
}

export interface iCreateTechRequest {
  name:
    | "JavaScript"
    | "Python"
    | "React"
    | "Express.js"
    | "HTML"
    | "CSS"
    | "Django"
    | "PostgreSQL"
    | "MongoDB";
}

export type tCreateTechResult = iCreateTechRequest & {
  id: number;
};

export type tAcceptedTechNames =
  | "JavaScript"
  | "Python"
  | "React"
  | "Express.js"
  | "HTML"
  | "CSS"
  | "Django"
  | "PostgreSQL"
  | "MongoDB";

export interface iValidateTechNameRequest {
  name: string;
}

export type tProjectTechnologiesResult = {
  id: number;
  addedIn: Date;
  projectId: number;
  technologyId: number;
};