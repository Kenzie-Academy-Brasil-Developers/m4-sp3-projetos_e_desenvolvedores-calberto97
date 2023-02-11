export interface iCreateDevRequest {
  name: string;
  email: string;
}

export type tCreateDevResult = iCreateDevRequest & {
  id: number;
  developerInfoId: number | null;
};

export type tCreateDevRequiredKeys = "name" | "email";

export interface iCreateDevInfoRequest {
  developerSince: Date;
  preferredOS: "Windows" | "Linux" | "MacOS";
}

export type tCreateDevInfoResult = iCreateDevInfoRequest & {
  id: number;
};

export interface iUpdateDevInfoRequest {
  developerSince?: Date;
  preferredOS?: "Windows" | "Linux" | "MacOS";
}

export type tCreateDevInfoRequiredKeys =
  | "developerSince"
  | "preferredOS";
