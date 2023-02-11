import { Request, Response, NextFunction } from "express";
import { QueryConfig, QueryResult } from "pg";
import { tCreateDevResult } from "./../interfaces/interfaceDev";
import { client } from "./../database/config";

export const searchForDev = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<Response | void> => {
  let id: number | undefined;

  if (request.params.id) {
    id = +request.params.id;
    if (isNaN(id)) {
      return response.status(400).json({
        message: 'Type of "ID" must be number',
      });
    }
  } else if (!isNaN(+request.body.developerId)) {
    id = +request.body.developerId;
  } else if (id) {
    return response.status(400).json({
      message: 'Type of "developerId" must be number',
    });
  } else {
    return next();
  }

  if (id === 0) {
    return response.status(400).json({
      message: 'Type of "developerId" must be number',
    });
  }
  if (id !== undefined) {
    const queryString: string = `
        SELECT * 
        FROM developers 
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
        message: `Developer with "ID" ${id} not found.`,
      });
    }
    return next();
  }
};
