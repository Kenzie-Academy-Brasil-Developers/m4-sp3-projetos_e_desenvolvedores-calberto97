import express, { Application, json } from "express";
import { startDatabase } from "./database/connection";
import {
  createDev,
  createDevInfo,
  deleteDev,
  showAllDevs,
  showDevByID,
  updateDev,
  updateDevInfo,
} from "./logic/logicDev";
import { searchForDev } from "./middlewares/middlewareDev";
import {
  addTechtoProject,
  createProject,
  deleteProject,
  deleteTechFromProject,
  showAllProjects,
  showProjectByDevID,
  showProjectByID,
  updateProject,
} from "./logic/logicProjects";
import {
  searchForProject,
  searchForTech,
} from "./middlewares/middlewareProjects";

const app: Application = express();
app.use(json());

app.post("/developers", createDev);
app.get("/developers", showAllDevs);
app.get("/developers/:id", searchForDev, showDevByID);
app.post("/developers/:id/infos", searchForDev, createDevInfo);
app.patch("/developers/:id", searchForDev, updateDev);
app.patch("/developers/:id/infos", searchForDev, updateDevInfo);
app.delete("/developers/:id", searchForDev, deleteDev);

app.post("/projects", searchForDev, createProject);
app.get("/projects", showAllProjects);
app.get("/projects/:pid", searchForProject, showProjectByID);
app.patch(
  "/projects/:pid",
  searchForProject,
  searchForDev,
  updateProject
);
app.delete("/projects/:pid", searchForProject, deleteProject);

app.get("/developers/:id/projects", searchForDev, showProjectByDevID);
app.post(
  "/projects/:pid/technologies",
  searchForProject,
  addTechtoProject
);
app.delete(
  "/projects/:pid/technologies/:name",
  searchForProject,
  searchForTech,
  deleteTechFromProject
);

const PORT: number = 3000;
const runningMsg: string = `Server running on http://localhost:${PORT}`;

app.listen(PORT, async () => {
  console.log(runningMsg);
  await startDatabase();
});
