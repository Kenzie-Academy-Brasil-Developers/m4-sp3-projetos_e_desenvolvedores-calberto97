CREATE TYPE os AS ENUM ('Windows', 'Linux', 'MacOS');
CREATE TABLE IF NOT EXISTS developer_infos (
    id SERIAL PRIMARY KEY,
    "developerSince" DATE NOT NULL,
    "preferredOS" os NOT NULL
);
CREATE TABLE IF NOT EXISTS developers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    "estimatedTime" VARCHAR(20) NOT NULL,
    repository VARCHAR(120) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE
);
CREATE TABLE IF NOT EXISTS technologies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL
);
INSERT INTO technologies (name)
VALUES ('JavaScript'),
    ('Python'),
    ('React'),
    ('Express.js'),
    ('HTML'),
    ('CSS'),
    ('Django'),
    ('PostgreSQL'),
    ('MongoDB');
CREATE TABLE IF NOT EXISTS projects_technologies (
    id SERIAL PRIMARY KEY,
    "addedIn" DATE NOT NULL
);
ALTER TABLE developers
ADD COLUMN "devInfo" INTEGER UNIQUE;
ALTER TABLE developers
ADD FOREIGN KEY ("devInfo") REFERENCES developer_infos("id") ON DELETE CASCADE;
ALTER TABLE projects
ADD COLUMN "developerID" INTEGER NOT NULL;
ALTER TABLE projects
ADD FOREIGN KEY ("developerID") REFERENCES developers("id");

ALTER TABLE projects_technologies
ADD COLUMN "projectID" INTEGER NOT NULL;
ALTER TABLE projects_technologies
ADD FOREIGN KEY ("projectID") REFERENCES projects("id");
ALTER TABLE projects_technologies
ADD COLUMN "technologyID" INTEGER NOT NULL;
ALTER TABLE projects_technologies
ADD FOREIGN KEY ("technologyID") REFERENCES technologies("id");

ALTER TABLE developers RENAME COLUMN "devInfo" TO "developerInfoId";

ALTER TABLE projects RENAME COLUMN "developerID" TO "developerId";

ALTER TABLE projects_technologies RENAME COLUMN "projectID" TO "projectId";

ALTER TABLE projects_technologies RENAME COLUMN "technologyID" TO "technologyId";

ALTER TABLE projects_technologies ALTER COLUMN "technologyId" DROP NOT NULL;

