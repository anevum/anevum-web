FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node creator-v1/agent-quality-lab/project-doctor-v001.mjs ./creator-v1/agent-quality-lab/project-doctor-v001.mjs
COPY --chown=node:node creator-v1/agent-quality-lab/project-doctor-brief-v001.mjs ./creator-v1/agent-quality-lab/project-doctor-brief-v001.mjs
COPY --chown=node:node creator-v1/workbench-alpha/document.mjs ./creator-v1/workbench-alpha/document.mjs
COPY --chown=node:node creator-v1/interface-builder/document.mjs ./creator-v1/interface-builder/document.mjs
COPY --chown=node:node services/continuance-lab/server.mjs ./services/continuance-lab/server.mjs
USER node
EXPOSE 3000
CMD ["node","services/continuance-lab/server.mjs"]
