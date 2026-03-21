# 云信旺店 - Docker 部署

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# 复制代码
COPY backend/ ./backend/
COPY database/ ./database/

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/database/shop.db
ENV TRUST_PROXY=true

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动服务
WORKDIR /app/backend
CMD ["node", "server.js"]
