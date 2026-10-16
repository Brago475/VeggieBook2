# Two stages: build the React app with Node, then serve the output with
# nginx. Only the built files reach the final image, so node_modules and the
# toolchain never ship.

FROM node:22-alpine AS build
WORKDIR /app

# package files first so npm ci is cached and only reruns when deps change.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
