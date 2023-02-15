import { Request, Response } from "express";
import { QueryConfig, QueryResult } from "pg";
import format from "pg-format";
import { client } from "../database/config";
import {
  iCreateDevInfoRequest,
  iCreateDevRequest,
  iUpdateDevInfoRequest,
  tCreateDevInfoResult,
  tCreateDevResult,
} from "./../interfaces/interfaceDev";

const validateCreateData = (
  payload: any,
  key1: string,
  key2: string
): iCreateDevRequest | iCreateDevInfoRequest => {
  const payloadKeys = Object.keys(payload);
  let requiredKeys: string[];

  if (
    key1 === "name" ||
    (key1 === "email" && key2 === "name") ||
    key2 === "email"
  ) {
    requiredKeys = ["name", "email"];
  } else {
    requiredKeys = ["developerSince", "preferredOS"];
  }

  const check = requiredKeys.every((key) => {
    return payloadKeys.includes(key);
  });

  const missingKeys = requiredKeys.filter(
    (key) => !payloadKeys.includes(key)
  );

  if (!check) {
    throw new Error(`Missing required keys: "${missingKeys}"`);
  }

  if (payload.name && typeof payload.name !== "string") {
    throw new Error('Type of "name" must be string');
  }

  if (payload.email && typeof payload.email !== "string") {
    throw new Error('Type of "email" must be string');
  }

  if (payload.developerSince) {
    if (
      typeof payload.developerSince !== "string" ||
      isNaN(new Date(payload.developerSince).getTime())
    ) {
      throw new Error(
        '"developerSince" value must be a Date in the format yyyy/mm/dd or dd/mm/yyyy'
      );
    }
  }

  if (payload.preferredOS) {
    if (
      payload.preferredOS !== "Windows" &&
      payload.preferredOS !== "Linux" &&
      payload.preferredOS !== "MacOs"
    ) {
      throw new Error(
        '"preferredOS" must be either Windows, Linux or MacOS'
      );
    }
  }

  return payload;
};

const validateUpdateData = (
  payload: any,
  key1: string,
  key2: string
): iUpdateDevInfoRequest => {
  const payloadKeys = Object.keys(payload);

  if (payload.developerSince) {
    if (
      typeof payload.developerSince !== "string" ||
      isNaN(new Date(payload.developerSince).getTime())
    ) {
      throw new Error(
        '"developerSince" value must be a Date in the format yyyy/mm/dd or dd/mm/yyyy'
      );
    }

    if (typeof payload.developerSince !== "string") {
      throw new Error(
        '"developerSince" value must be a Date in the format yyyy/mm/dd or dd/mm/yyyy'
      );
    }
  }

  if (payload.preferredOS) {
    if (
      payload.preferredOS !== "Windows" &&
      payload.preferredOS !== "Linux" &&
      payload.preferredOS !== "MacOs"
    ) {
      throw new Error(
        '"preferredOS" must be either Windows, Linux or MacOS'
      );
    }
  }

  if (payload[payloadKeys[0]] || payload[payloadKeys[1]]) {
    if (
      payload[payloadKeys[0]] &&
      typeof payload[payloadKeys[0]] !== "string"
    ) {
      throw new Error(`Type of "${payloadKeys[0]}" must be string`);
    }
    if (
      payload[payloadKeys[1]] &&
      typeof payload[payloadKeys[1]] !== "string"
    ) {
      throw new Error(`Type of "${payloadKeys[1]}" must be string`);
    }
    return payload;
  } else {
    throw new Error(
      `At least one of those keys must be sent: "${key1}", "${key2}"`
    );
  }
};

export const createDev = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    validateCreateData(request.body, "name", "email");
    const { name, email } = request.body;

    const queryString: string = format(
      `
    INSERT INTO developers(%I)
    VALUES (%L)
    RETURNING *;   
    `,
      ["name", "email"],
      [name, email]
    );

    const queryResult: QueryResult<tCreateDevResult> =
      await client.query(queryString);

    return response.status(201).json(queryResult.rows[0]);
  } catch (error: any) {
    console.log(error);
    return response.status(400).json({ error: error.message });
  }
};

export const showAllDevs = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const queryString: string = `
  SELECT d.id AS "developerId",
      d.name AS "developerName",
      d.email AS "developerEmail",
      de.id AS "developerInfoId",
      de."developerSince" AS "developerInfoDeveloperSince",
      de."preferredOS" AS "developerInfoPreferredOS"
  FROM developers d
      LEFT JOIN developer_infos de ON d."developerInfoId" = de.id;
  `;

  const queryResult: QueryResult<tCreateDevResult[]> =
    await client.query(queryString);

  return response.status(200).json(queryResult.rows);
};

export const showDevByID = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const id = +request.params.id;

  const queryString: string = `
  SELECT d.id AS "developerId",
      d.name AS "developerName",
      d.email AS "developerEmail",
      de.id AS "developerInfoId",
      de."developerSince" AS "developerInfoDeveloperSince",
      de."preferredOS" AS "developerInfoPreferredOS"
  FROM developers d
      LEFT JOIN developer_infos de ON d."developerInfoId" = de.id
  WHERE d.id = $1;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  const queryResult: QueryResult<tCreateDevResult> =
    await client.query(queryConfig);
  return response.status(200).json(queryResult.rows[0]);
};

export const createDevInfo = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const id = +request.params.id;

    let queryString: string = `
    SELECT * FROM developers
    WHERE id = $1;
    `;

    let queryConfig: QueryConfig = {
      text: queryString,
      values: [id],
    };

    let queryResult: QueryResult<tCreateDevResult> =
      await client.query(queryConfig);
    let devInfoID = queryResult.rows[0].developerInfoId;
    if (devInfoID) {
      return response.status(409).json({
        message: `Developer info already exists on developer with "ID" ${id}`,
      });
    }

    let treatedPreferredOS;

    if (
      request.body.preferredOS &&
      typeof request.body.preferredOS === "string"
    ) {
      treatedPreferredOS =
        request.body.preferredOS[0].toUpperCase() +
        request.body.preferredOS.slice(1).toLowerCase();
      if (treatedPreferredOS === "Macos") {
        treatedPreferredOS = "MacOS";
      }
      request.body.preferredOS = treatedPreferredOS;
    }

    validateCreateData(request.body, "developerSince", "preferredOS");
    let { developerSince, preferredOS } = request.body;

    queryString = format(
      `
      INSERT INTO developer_infos(%I)
      VALUES (%L)
      RETURNING *;
    `,
      ["developerSince", "preferredOS"],
      [developerSince, preferredOS]
    );

    queryResult = await client.query(queryString);
    devInfoID = queryResult.rows[0].id;

    queryString = format(
      `
      UPDATE developers
      SET (%I) = ROW (%L)
      WHERE id = $1
      RETURNING *;  
    `,
      ["developerInfoId"],
      [devInfoID]
    );

    queryConfig = {
      text: queryString,
      values: [id],
    };

    await client.query(queryConfig);

    return response.status(201).json(queryResult.rows[0]);
  } catch (error: any) {
    console.log(error);
    return response.status(400).json({ error: error.message });
  }
};

export const updateDev = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const id = +request.params.id;
    validateUpdateData(request.body, "name", "email");
    const { name, email } = request.body;

    let validKeys: ["name"] | ["email"] | ["name", "email"];
    let validValues;

    if (!email) {
      validKeys = ["name"];
      validValues = [name];
    } else if (!name) {
      validKeys = ["email"];
      validValues = [email];
    } else {
      validKeys = ["name", "email"];
      validValues = [name, email];
    }

    const queryString: string = format(
      `
      UPDATE developers
      SET (%I) = ROW (%L)
      WHERE id = $1
      RETURNING *;
    `,
      validKeys,
      validValues
    );

    const queryConfig: QueryConfig = {
      text: queryString,
      values: [id],
    };

    const queryResult: QueryResult<tCreateDevResult> =
      await client.query(queryConfig);

    return response.status(200).json(queryResult.rows[0]);
  } catch (error: any) {
    console.log(error);
    return response.status(400).json({ error: error.message });
  }
};

export const updateDevInfo = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const devID = +request.params.id;
    validateUpdateData(request.body, "preferredOS", "developerSince");
    const { developerSince, preferredOS } = request.body;

    let queryString: string = `
      SELECT * FROM developers
      WHERE id = $1;    
    `;

    let queryConfig: QueryConfig = {
      text: queryString,
      values: [devID],
    };

    let queryResult: QueryResult<tCreateDevResult> =
      await client.query(queryConfig);
    const devInfoID = +queryResult.rows[0].developerInfoId!;

    if (devInfoID === 0) {
      throw new Error(
        `Developer with "ID" ${devID} doesn't have a developerInfo to be updated`
      );
    }

    let validKeys:
      | ["developerSince"]
      | ["preferredOS"]
      | ["developerSince", "preferredOS"];
    let validValues;

    if (!preferredOS) {
      validKeys = ["developerSince"];
      validValues = [developerSince];
    } else if (!developerSince) {
      validKeys = ["preferredOS"];
      validValues = [preferredOS];
    } else {
      validKeys = ["developerSince", "preferredOS"];
      validValues = [developerSince, preferredOS];
    }

    queryString = format(
      `
      UPDATE developer_infos
      SET (%I) = ROW (%L)
      WHERE id = $1
      RETURNING *;
    `,
      validKeys,
      validValues
    );

    queryConfig = {
      text: queryString,
      values: [devInfoID],
    };

    queryResult = await client.query(queryConfig);
    return response.status(200).json(queryResult.rows[0]);
  } catch (error: any) {
    console.log(error);
    return response.status(400).json({ error: error.message });
  }
};

export const deleteDev = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const id = +request.params.id;

  let queryString: string = `
  SELECT * FROM developers
  WHERE id = $1;  
  `;

  let queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  let queryResult: QueryResult<tCreateDevResult> = await client.query(
    queryConfig
  );

  const devInfoID = queryResult.rows[0].developerInfoId;

  if (!devInfoID) {
    queryString = `
    DELETE FROM developers
    WHERE id = $1;
    `;

    queryConfig = {
      text: queryString,
      values: [id],
    };

    await client.query(queryConfig);
    return response.status(204).send();
  }

  queryString = `
  DELETE FROM developer_infos
  WHERE id = $1;
  `;

  queryConfig = {
    text: queryString,
    values: [+devInfoID],
  };

  await client.query(queryConfig);

  return response.status(204).send();
};
