###########################################################
# Stage: base
#
# This stage serves as the base for all of the other stages.
# By using this stage, it provides a consistent base for both
# the dev and prod versions of the image.
###########################################################
FROM node:22-slim AS base

# Setup a non-root user to run the app
WORKDIR /usr/local/app
RUN useradd -m appuser && chown -R appuser /usr/local/app
USER appuser
COPY --chown=appuser:appuser package.json package-lock.json tsconfig.json ./
COPY --chown=appuser:appuser ./src ./src

RUN npm ci
RUN npm run build


###########################################################
# Stage: final
#
# This stage serves as the final image for production. It
# installs only the production dependencies.
###########################################################
FROM base AS final
ENV NODE_ENV=production
RUN npm ci --production --ignore-scripts && npm cache clean --force
# Copy only compiled JS and necessary files
COPY --chown=appuser:appuser --from=base /usr/local/app/dist ./dist
COPY --chown=appuser:appuser --from=base /usr/local/app/node_modules ./node_modules
COPY --chown=appuser:appuser --from=base /usr/local/app/package.json ./package.json

EXPOSE 3000

CMD [ "node", "dist/app.js" ]