# # Use Node 18
# FROM node:18-slim

# # Install dependencies required for Oracle DB
# RUN apt-get update && apt-get install -y \
#     libaio1 \
#     unzip \
#     curl \
#     python3 \
#     make \
#     g++ \
#     && rm -rf /var/lib/apt/lists/*

# # Set working directory
# WORKDIR /app

# # Copy package files and install dependencies
# COPY package*.json ./
# RUN npm install

# # ✅ Copy all code
# COPY . .

# # ✅ Set Oracle Instant Client path
# ENV LD_LIBRARY_PATH=/app/oracle_client/instantclient_23_26

# # ✅ Expose your app port
# EXPOSE 3007

# # Start the app
# CMD ["node", "src/server.js"]



# Use Node 18 base image
# Use Node 18 base image
FROM node:18-slim

# Install required dependencies for Oracle Client
RUN apt-get update && apt-get install -y \
    libaio1 \
    unzip \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# ✅ Copy all code including oracle_client
COPY . .

# ✅ Configure Oracle Instant Client
ENV LD_LIBRARY_PATH=/app/oracle_client/instantclient_23_26
ENV PATH=/app/oracle_client/instantclient_23_26:$PATH

# ✅ Register the Oracle libs system-wide
RUN echo "/app/oracle_client/instantclient_23_26" > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig

# Expose app port
EXPOSE 3007

# Start app
CMD ["node", "src/server.js"]
