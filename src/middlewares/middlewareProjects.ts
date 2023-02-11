import { Request, Response, NextFunction } from "express";
import { QueryConfig, QueryResult } from "pg";
import { tCreateDevResult } from "./../interfaces/interfaceDev";
import { client } from "./../database/config";
import {
  tAcceptedTechNames,
  tCreateTechResult,
} from "../interfaces/interfaceProjects";

export const searchForProject = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<Response | void> => {
  const id = +request.params.pid;
  if (isNaN(id)) {
    return response.status(400).json({
      message: 'Type of "ID" must be number',
    });
  }

  const queryString: string = `
    SELECT *
    FROM projects
    WHERE id = $1
    `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  const queryResult: QueryResult<tCreateDevResult> =
    await client.query(queryConfig);

  if (!queryResult.rowCount) {
    return response.status(404).json({
      message: `Project with "ID" ${id} not found.`,
    });
  }

  return next();
};

export const searchForTech = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<Response | void> => {
  let treatedName =
    request.params.name[0].toUpperCase() +
    request.params.name.slice(1).toLowerCase();
  if (treatedName === "Javascript") {
    treatedName = "JavaScript";
  }
  if (treatedName === "Html") {
    treatedName = "HTML";
  }
  if (treatedName === "Css") {
    treatedName = "CSS";
  }
  if (treatedName === "Postgresql") {
    treatedName = "PostgreSQL";
  }
  if (treatedName === "Mongodb") {
    treatedName = "MongoDB";
  }
  request.params.name = treatedName;

  const techName = request.params.name;
  const projectID = +request.params.pid;

  const acceptedNames: tAcceptedTechNames[] = [
    "JavaScript",
    "Python",
    "React",
    "Express.js",
    "HTML",
    "CSS",
    "Django",
    "PostgreSQL",
    "MongoDB",
  ];

  const check = acceptedNames.includes(techName as any);
  if (!check) {
    return response.status(404).json({
      message: `Technology name must be a string with a value of any of these: "${acceptedNames}"`,
    });
  }

  let queryString: string = `
  SELECT * FROM technologies WHERE name = $1;
  `;

  let queryConfig: QueryConfig = {
    text: queryString,
    values: [techName],
  };

  let queryResult: QueryResult<tCreateTechResult> =
    await client.query(queryConfig);
  const techID = queryResult.rows[0].id;

  queryString = `
    SELECT *
    FROM projects_technologies
    WHERE "projectId" = $1 AND "technologyId" = $2;  
    `;

  queryConfig = {
    text: queryString,
    values: [projectID, techID],
  };

  queryResult = await client.query(queryConfig);

  if (!queryResult.rowCount) {
    return response.status(404).json({
      message: `Technology "${techName}" not found on this Project.`,
    });
  }

  return next();
};
