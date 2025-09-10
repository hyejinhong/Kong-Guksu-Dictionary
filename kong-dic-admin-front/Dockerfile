# 빌드 환경
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# 실행 환경
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 81

CMD ["nginx", "-g", "daemon off;"]