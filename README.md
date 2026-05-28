# Project Manager - Punto de partida

Este proyecto busca construir una aplicacion de gestion de proyectos inspirada en herramientas como Jira, ClickUp o Monday, combinando flujo visual tipo Kanban con organizacion SCRUM.

## Vision del producto

La aplicacion debe permitir que una persona o equipo:

- cree y gestione tareas
- organice trabajo por columnas Kanban dentro de cada sprint
- planifique sprints
- mantenga un backlog de proyecto fuera del sprint
- vea progreso del equipo en tiempo real

## Recomendacion para empezar

En lugar de intentar construir todo a la vez, conviene arrancar con un **MVP** pequeno pero util.

### MVP recomendado

Version 1:

- autenticacion basica
- creacion de workspace
- tablero Kanban por sprint
- columnas fijas: `Backlog`, `To Do`, `In Progress`, `Review`, `Done`
- crear, editar y mover tareas
- backlog de proyecto
- crear un sprint activo
- mover tareas del backlog al sprint activo

Version 2:

- asignar usuarios a tareas
- etiquetas y prioridades
- comentarios
- historial de actividad

Version 3:

- dashboard con metricas
- story points
- burndown chart
- notificaciones
- integraciones

## Stack recomendado

- Frontend: `React + Vite`
- Backend: `Node.js + Express`
- Base de datos: `PostgreSQL`
- ORM: `Prisma`
- Autenticacion: `JWT`
- Tiempo real: `Socket.IO`
- Drag and drop: `dnd-kit`

## Arquitectura inicial

Podemos dividir el sistema en 3 bloques:

1. `client/`
   Aplicacion web con el tablero, vistas de sprint y formularios.
2. `server/`
   API para usuarios, workspaces, tareas, columnas y sprints.
3. `database/`
   Esquema Prisma y modelo de datos.

## Modelo de datos base

Entidades recomendadas para la primera version:

- `User`
- `Workspace`
- `Project`
- `Sprint`
- `Column`
- `Task`

Relaciones principales:

- un `Workspace` tiene muchos `Project`
- un `Project` tiene muchos `Sprint`
- un `Project` tiene muchas `Column`
- una `Column` tiene muchas `Task`
- una `Task` puede pertenecer a un `Sprint`

## Primera meta tecnica

La primera entrega deberia permitir:

1. iniciar sesion
2. abrir un proyecto
3. gestionar el backlog del proyecto
4. abrir el tablero del sprint activo
5. mover la tarea entre columnas del sprint

Si eso funciona, ya tenemos una base muy buena sobre la cual agregar SCRUM.

## Orden sugerido de trabajo

1. definir alcance del MVP
2. modelar base de datos
3. crear backend con CRUD de tareas, columnas y sprints
4. crear frontend con tablero Kanban
5. conectar drag and drop con persistencia
6. agregar autenticacion
7. agregar sprint management

## Proximo paso recomendado

El siguiente paso mas util es crear la estructura inicial del proyecto:

- `client/` con Vite + React
- `server/` con Express
- `prisma/` con el esquema inicial

Antes de sumar analitica, tiempo real o integraciones, necesitamos que el flujo basico de tareas funcione muy bien.
