FROM node:20-alpine\nWORKDIR /app\nCOPY package.json package-lock.json* ./\nRUN npm install\nCOPY . .\nCMD ["npm", "run", "dev"]
