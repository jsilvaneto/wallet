# Base image
FROM node:20-alpine

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Generate Prisma client before starting
RUN npm run build || true

# Expose port
EXPOSE 3000

# Start command overrides in docker-compose for dev
CMD [ "npm", "run", "start:prod" ]
