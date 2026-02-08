# Step 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app

# نصب وابستگی‌ها
COPY package.json package-lock.json ./
RUN npm install && npm cache clean --force

# کپی کردن کدهای React و ساخت پروژه
COPY . .
RUN npm run build

FROM nginx:alpine

# Copy your custom configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copying built files (Check if your build folder is 'build' or 'dist')
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
