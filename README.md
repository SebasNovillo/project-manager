# Project Manager

Project Manager is a web application for planning work at the project level and executing it inside sprint boards. It combines a lightweight Scrum flow with a visual Kanban experience inspired by tools like Jira, ClickUp, and Monday.

## Product goal

The app is designed to help a person or team:

- manage projects and tasks
- keep a project backlog outside the sprint
- start and complete sprints
- move committed work across fixed Kanban stages
- track progress with a simple visual workflow

## Core workflow

The current product model is:

- a `Project` owns the planning space
- a `Sprint` owns the execution board
- a `Task` can stay in the project backlog or be assigned to a sprint
- fixed columns define the workflow: `Backlog`, `To Do`, `In Progress`, `Review`, `Done`

This means planning happens at the project level, while active work happens inside a sprint board.

## Current scope

The application currently focuses on:

- authentication
- project creation and editing
- project backlog management
- sprint creation and completion
- sprint board navigation
- task creation, editing, deletion, and movement across columns

## Tech stack

- Frontend: `React + Vite`
- Backend: `Node.js + Express`
- Database: `PostgreSQL`
- ORM: `Prisma`
- Authentication: `JWT`
- Drag and drop: `dnd-kit`

## Project structure

- `client/` contains the web application UI
- `server/` contains the API, business logic, and Prisma setup
- `docs/` contains planning notes and product references

## Data model

Main entities:

- `User`
- `Project`
- `Sprint`
- `Column`
- `Task`

Main relationships:

- one `User` owns many `Project` records
- one `Project` owns many `Sprint` records
- one `Project` owns many `Column` records
- one `Column` owns many `Task` records
- one `Task` may belong to one `Sprint`

## Local development

Install dependencies:

```bash
npm install
```

Run the client and server together:

```bash
npm run dev
```

Run only the client:

```bash
npm run dev:client
```

Run only the server:

```bash
npm run dev:server
```

Build the client:

```bash
npm run build
```
