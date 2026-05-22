FROM nginx:alpine

# Copy built files for the habits app
COPY  /dist/apps/habits /usr/share/nginx/html

# Copy custom nginx config that will handle the habits app
COPY apps/habits/nginx/habits.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
