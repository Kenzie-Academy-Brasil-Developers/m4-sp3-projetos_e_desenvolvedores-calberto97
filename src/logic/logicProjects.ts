import { Request, Response } from "express";
import { QueryConfig, QueryResult } from "pg";
import format from "pg-format";
import { client } from "../database/config";
import {
  iCreateProjectRequest,
  iUpdateProjectValidate,
  iValidateTechNameRequest,
  tAcceptedTechNames,
  tCreateProjectRequiredKeys,
  tCreateProjectResult,
  tCreateTechResult,
  tProjectTechnologiesResult,
} from "./../interfaces/interfaceProjects";

const validateCreateProjectData = (
  payload: any
): iCreateProjectRequest => {
  let payloadKeys = Object.keys(payload);
  const payloadValues = Object.values(payload);

  const requiredKeys: tCreateProjectRequiredKeys[] = [
    "name",
    "description",
    "estimatedTime",
    "repository",
    "startDate",
    "developerId",
  ];

  const acceptedKeys = [...requiredKeys, "endDate"];

  const check = requiredKeys.every((key) => {
    return payloadKeys.includes(key);
  });

  const missingKeys = requiredKeys.filter(
    (key) => !payloadKeys.includes(key)
  );

  if (!check) {
    throw new Error(`Missing required keys: "${missingKeys}"`);
  }

  const checkExtra = payloadKeys.every((key) => {
    return requiredKeys.includes(key as any);
  });

  if (!checkExtra) {
    const extraKey = payloadKeys.filter(
      (key) => !acceptedKeys.includes(key as any)
    );

    payloadKeys = acceptedKeys.filter(
      (key) => !extraKey.includes(key)
    );
  }

  payloadKeys.map((key, index) => {
    if (typeof payloadValues[index] !== "string") {
      if (key === "developerId") {
        return;
      } else {
        throw new Error(`Type of "${key}" must be string`);
      }
    }
  });

  if (typeof payload.developerId !== "number") {
    throw new Error('Type of "developerId" must be number');
  }

  return payload;
};

const validateUpdateProjectData = (
  payload: any
): iUpdateProjectValidate => {
  let payloadKeys = Object.keys(payload);
  const payloadValues = Object.values(payload);

  const requiredKeys: tCreateProjectRequiredKeys[] = [
    "name",
    "description",
    "estimatedTime",
    "repository",
    "startDate",
    "developerId",
  ];
  const acceptedKeys = [...requiredKeys, "endDate"];

  const checkExtra = payloadKeys.every((key) => {
    return requiredKeys.includes(key as any);
  });

  let acceptedData: iUpdateProjectValidate = {
    name: "",
    description: "",
    estimatedTime: "",
    repository: "",
    startDate: new Date(),
    developerId: 0,
    endDate: new Date(),
  };

  if (!checkExtra) {
    const extraKey = payloadKeys.filter(
      (key) => !acceptedKeys.includes(key as any)
    );

    payloadKeys = payloadKeys.filter(
      (key) => !extraKey.includes(key)
    );

    const acceptedValues = payloadKeys.map((key) => {
      return payload[key];
    });

    acceptedData = payloadKeys.reduce((acc, key, index) => {
      return { ...acc, [key]: acceptedValues[index] };
    }, {});
  }

  const check = payloadKeys.filter((key) =>
    acceptedKeys.includes(key)
  );

  const missingKeys = acceptedKeys.filter(
    (key) => !payloadKeys.includes(key)
  );

  if (!check.length) {
    throw new Error(
      `At least one of those keys must be sent: "${missingKeys}"`
    );
  }

  payloadKeys.map((key, index) => {
    if (typeof payloadValues[index] !== "string") {
      if (key === "developerId") {
        return;
      } else {
        throw new Error(`Type of "${key}" must be string`);
      }
    }
  });

  return acceptedData;
};

const validateTechNameData = (
  payload: any
): iValidateTechNameRequest => {
  let treatedName =
    payload.name[0].toUpperCase() +
    payload.name.slice(1).toLowerCase();
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
  payload.name = treatedName;

  const { name } = payload;

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

  if (!name) {
    throw new Error('Missing required key: "name"');
  }

  const check = acceptedNames.includes(name);
  if (!check) {
    throw new Error(
      `Technology name must be a string with a value of any of these: "${acceptedNames}"`
    );
  }

  return payload;
};

export const createProject = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    validateCreateProjectData(request.body);
    const {
      name,
      description,
      estimatedTime,
      repository,
      startDate,
      endDate,
      developerId,
    } = request.body;

    const dataKeys = [
      "name",
      "description",
      "estimatedTime",
      "repository",
      "startDate",
      "developerId",
    ];

    const dataValues = [
      name,
      description,
      estimatedTime,
      repository,
      startDate,
      developerId,
    ];

    if (endDate) {
      dataValues.push(endDate);
      dataKeys.push("endDate");
    }

    let queryString: string = format(
      `
    INSERT INTO projects(%I)
    VALUES (%L)
    RETURNING *;   
    `,
      dataKeys,
      dataValues
    );

    const queryResult: QueryResult<tCreateProjectResult> =
      await client.query(queryString);

    queryString = format(
      `
        INSERT INTO projects_technologies(%I)
        VALUES (%L)
        RETURNING *;
    `,
      ["addedIn", "projectId", "technologyId"],
      [new Date(), +queryResult.rows[0].id, null]
    );

    await client.query(queryString);

    return response.status(201).json(queryResult.rows[0]);
  } catch (error: any) {
    if (
      error.message.includes("date/time field value out of range:")
    ) {
      return response.status(400).json({
        error:
          "Date values must be in the format yyyy/mm/dd or dd/mm/yyyy",
      });
    }
    console.log(error);
    return response.status(400).json({ error: error.message });
  }
};

export const showAllProjects = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const queryString: string = `
    SELECT 
        p.id AS "projectId",
        p.name AS "projectName",
        p.description AS "projectDescription",
        p."estimatedTime" AS "projectEstimatedTime",
        p. repository AS "projectRepository",
        p."startDate" AS "projectStartDate",
        p."endDate" AS "projectEndDate",
        p."developerId" AS "projectDeveloperId",
        t.id AS "technologyId",
        t.name AS "technologyName"
    FROM  projects_technologies pt
    LEFT JOIN projects p ON pt."projectId" = p.id
    LEFT JOIN technologies t ON pt."technologyId" = t.id;  
  `;

  const queryResult: QueryResult<tCreateProjectResult[]> =
    await client.query(queryString);

  return response.status(200).json(queryResult.rows);
};

export const showProjectByID = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const id = +request.params.pid;

  const queryString: string = `
  SELECT 
      p.id AS "projectId",
      p.name AS "projectName",
      p.description AS "projectDescription",
      p."estimatedTime" AS "projectEstimatedTime",
      p. repository AS "projectRepository",
      p."startDate" AS "projectStartDate",
      p."endDate" AS "projectEndDate",
      p."developerId" AS "projectDeveloperId",
      t.id AS "technologyId",
      t.name AS "technologyName"
  FROM  projects_technologies pt
  LEFT JOIN projects p ON pt."projectId" = p.id
  LEFT JOIN technologies t ON pt."technologyId" = t.id
  WHERE p.id = $1;  
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  const queryResult: QueryResult<tCreateProjectResult> =
    await client.query(queryConfig);
  return response.status(200).json(queryResult.rows);
};

export const updateProject = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const id = +request.params.pid;
    const treatedData = validateUpdateProjectData(request.body);

    const queryString: string = format(
      `
    UPDATE projects
    SET (%I) = ROW (%L)
    WHERE id = $1
    RETURNING *;
    `,
      Object.keys(treatedData),
      Object.values(treatedData)
    );

    const queryConfig: QueryConfig = {
      text: queryString,
      values: [id],
    };

    const queryResult: QueryResult<tCreateProjectResult> =
      await client.query(queryConfig);

    return response.status(200).json(queryResult.rows[0]);
  } catch (error: any) {
    if (
      error.message.includes("invalid input syntax for type integer:")
    ) {
      return response
        .status(400)
        .json({ error: 'Type of "developerId" must be a number' });
    } else if (
      error.message.includes("invalid input syntax for type date:") ||
      error.message.includes("date/time field value out of range")
    ) {
      return response.status(400).json({
        error:
          "Date values must be in the format yyyy/mm/dd or dd/mm/yyyy",
      });
    }
    console.log(error);
    return response.status(400).json({ error: error.message });
  }
};

export const deleteProject = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const id = +request.params.pid;

  let queryString: string = `
      DELETE FROM projects_technologies
      WHERE "projectId" = $1;  
    `;

  let queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  await client.query(queryConfig);

  queryString = `
    DELETE FROM projects
    WHERE id = $1;  
  `;

  queryConfig = {
    text: queryString,
    values: [id],
  };

  await client.query(queryConfig);

  return response.status(204).send();
};

export const showProjectByDevID = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const id = +request.params.id;

  const queryString: string = `
  SELECT 
      d.id AS "developerId",
      d.name AS "developerName",
      d.Email AS "developerEmail",
      di.id AS "developerInfoId",
      di."developerSince" AS "developerInfoDeveloperSince",
      di."preferredOS" AS "developerInfoPreferredOS",
      p.id AS "projectId",
      p.name AS "projectName",
      p.description AS "projectDescription",
      p."estimatedTime" AS "projectEstimatedTime",
      p.repository AS "projectRepository",
      p."startDate" AS "projectStartDate",
      p."endDate" AS "projectEndDate",
      t.id AS "technologyId",
      t.name AS "technologyName"
  FROM projects p
      LEFT JOIN developers d ON p."developerId" = d.id
      LEFT JOIN developer_infos di ON d."developerInfoId" = di.id
      LEFT JOIN projects_technologies pt ON p.id = pt."projectId"
      LEFT JOIN technologies t ON pt."technologyId" = t.id
  WHERE d.id = $1;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  const queryResult: QueryResult<tCreateProjectResult> =
    await client.query(queryConfig);
  return response.status(200).json(queryResult.rows);
};

export const addTechtoProject = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const id = +request.params.pid;
    validateTechNameData(request.body);
    const { name } = request.body;

    let queryString: string = `
    SELECT * FROM technologies WHERE name = $1
    `;

    let queryConfig: QueryConfig = {
      text: queryString,
      values: [name],
    };

    let queryResult: QueryResult<tProjectTechnologiesResult> =
      await client.query(queryConfig);

    const techID = +queryResult.rows[0].id;

    queryString = `
    SELECT * FROM projects_technologies
    WHERE "projectId" = $1;    
    `;

    queryConfig = {
      text: queryString,
      values: [id],
    };

    queryResult = await client.query(queryConfig);
    if (queryResult.rows[0].technologyId === null) {
      queryString = `
      UPDATE projects_technologies
      SET
      "technologyId" = $1
      WHERE "projectId" = $2
      `;

      queryConfig = {
        text: queryString,
        values: [techID, id],
      };

      await client.query(queryConfig);
    } else if (
      queryResult.rows.filter((key) => +key.technologyId == techID)
        .length > 0
    ) {
      return response.status(409).json({
        message: `"${name}" was already added to Project with "Id" ${id}`,
      });
    } else {
      queryString = format(
        `
        INSERT INTO projects_technologies(%I)
        VALUES (%L)
        RETURNING *;
        `,
        ["addedIn", "projectId", "technologyId"],
        [new Date(), id, techID]
      );

      await client.query(queryString);
    }

    queryString = `
    SELECT t.id AS "technologyId",
        t.name AS "technologyName",
        p.id AS "projectId",
        p.name AS "projectName",
        p.description AS "projectDescription",
        p."estimatedTime" AS "projectEstimatedTime",
        p.repository AS "projectRepository",
        p."startDate" AS "projectStartDate",
        p."endDate" AS "projectEndDate"
    FROM projects_technologies pt
        LEFT JOIN technologies t ON pt."technologyId" = t.id
        LEFT JOIN projects p ON pt."projectId" = p.id
    WHERE p.id = $1;
    `;

    queryConfig = {
      text: queryString,
      values: [id],
    };

    queryResult = await client.query(queryConfig);

    return response.status(201).json(queryResult.rows[0]);
  } catch (error: any) {
    if (
      error.message.includes(
        "Cannot read properties of undefined (reading 'toUpperCase')"
      )
    ) {
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
      return response.status(400).json({
        error: `Technology name must be a string with a value of any of these: "${acceptedNames}"`,
      });
    }
    console.log(error);
    return response.status(400).json({ error: error.message });
  }
};

export const deleteTechFromProject = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const projectID = +request.params.pid;
  const techName = request.params.name;

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
  DELETE FROM projects_technologies
  WHERE "projectId" = $1 AND "technologyId" = $2;  
  `;

  queryConfig = {
    text: queryString,
    values: [projectID, techID],
  };

  await client.query(queryConfig);

  return response.status(204).send();
};
