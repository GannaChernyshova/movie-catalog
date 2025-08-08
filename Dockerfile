###########################################################
# Stage: base
# This stage serves as the base for all of the other stages.
# By using this stage, it provides a consistent base for both
# the dev and prod versions of the image.
###########################################################
FROM demonstrationorg/dhi-node:22-dev AS base
WORKDIR /usr/local/app
RUN useradd -m appuser && chown -R appuser /usr/local/app
USER appuser
COPY --chown=appuser:appuser package.json package-lock.json ./

###########################################################
# Stage: dev
# This stage is used to run the application in a development
# environment. It installs all app dependencies and will
# start the app in a dev mode that will watch for file changes
# and automatically restart the app.
###########################################################
FROM base AS dev
ENV NODE_ENV=development
RUN npm ci --ignore-scripts
COPY --chown=appuser:appuser ./src ./src
EXPOSE 3000
CMD ["npx", "nodemon", "src/app.js"]

###########################################################
# Stage: final
# This stage serves as the final image for production. It
# installs only the production dependencies.
###########################################################
# Deps: install only prod deps
FROM base AS prod-deps
ENV NODE_ENV=production
RUN npm ci --production --ignore-scripts && npm cache clean --force

# Final: clean prod image
FROM demonstrationorg/dhi-node:22 AS final
WORKDIR /usr/local/app
COPY --from=prod-deps /usr/local/app/node_modules ./node_modules
COPY ./src ./src
EXPOSE 3000
CMD [ "node", "src/app.js" ]