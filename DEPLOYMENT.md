# Deployment Guide

This guide explains how to deploy the Async Calendar application to AWS.

## Option 1: AWS Lightsail (Recommended for cost-effectiveness)

AWS Lightsail is a simplified cloud service that offers virtual servers, storage, databases, and networking at a low, predictable price.

### Prerequisites

1. AWS account
2. AWS CLI installed and configured
3. Docker and Docker Compose installed locally

### Steps

1. **Create a Lightsail Container Service**

   ```bash
   aws lightsail create-container-service --service-name async-calendar --power small --scale 1
   ```

2. **Create a Lightsail Database**

   ```bash
   aws lightsail create-relational-database --relational-database-name async-calendar-db --relational-database-blueprint postgres --relational-database-bundle micro_2_0 --master-database-name asynccalendar --master-username postgres --master-password <your-password>
   ```

3. **Build and Push Container Images**

   ```bash
   # Build images
   docker-compose build

   # Push to Lightsail
   aws lightsail push-container-image --service-name async-calendar --label backend --image async-calendar-backend:latest
   aws lightsail push-container-image --service-name async-calendar --label frontend --image async-calendar-frontend:latest
   ```

4. **Create a Deployment**

   Create a `containers.json` file:

   ```json
   {
     "backend": {
       "image": ":async-calendar.backend.latest",
       "ports": {
         "8000": "HTTP"
       },
       "environment": {
         "POSTGRES_SERVER": "<your-db-endpoint>",
         "POSTGRES_USER": "postgres",
         "POSTGRES_PASSWORD": "<your-password>",
         "POSTGRES_DB": "asynccalendar",
         "SECRET_KEY": "<your-secret-key>"
       }
     },
     "frontend": {
       "image": ":async-calendar.frontend.latest",
       "ports": {
         "3000": "HTTP"
       },
       "environment": {
         "REACT_APP_API_URL": "https://<your-backend-url>/api"
       }
     }
   }
   ```

   Deploy:

   ```bash
   aws lightsail create-container-service-deployment --service-name async-calendar --containers file://containers.json --public-endpoint container=frontend,container-port=3000,health-check={path=/}
   ```

## Option 2: AWS Elastic Beanstalk

Elastic Beanstalk is an easy-to-use service for deploying and scaling web applications.

### Prerequisites

1. AWS account
2. AWS CLI and EB CLI installed and configured
3. Docker installed locally

### Steps

1. **Initialize Elastic Beanstalk Application**

   ```bash
   eb init -p docker async-calendar
   ```

2. **Configure Environment Variables**

   Create a `.ebextensions/01_env.config` file:

   ```yaml
   option_settings:
     aws:elasticbeanstalk:application:environment:
       POSTGRES_SERVER: <your-rds-endpoint>
       POSTGRES_USER: postgres
       POSTGRES_PASSWORD: <your-password>
       POSTGRES_DB: asynccalendar
       SECRET_KEY: <your-secret-key>
   ```

3. **Create an RDS Database**

   ```bash
   aws rds create-db-instance --db-instance-identifier async-calendar-db --db-instance-class db.t3.micro --engine postgres --allocated-storage 20 --master-username postgres --master-user-password <your-password> --db-name asynccalendar
   ```

4. **Deploy the Application**

   ```bash
   eb create async-calendar-env
   ```

## Option 3: AWS ECS with Fargate

For more control and scalability, you can use Amazon ECS with Fargate.

### Prerequisites

1. AWS account
2. AWS CLI installed and configured
3. Docker installed locally

### Steps

1. **Create an ECR Repository**

   ```bash
   aws ecr create-repository --repository-name async-calendar/backend
   aws ecr create-repository --repository-name async-calendar/frontend
   ```

2. **Build and Push Docker Images**

   ```bash
   # Login to ECR
   aws ecr get-login-password | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.<region>.amazonaws.com

   # Build and tag images
   docker build -t <your-account-id>.dkr.ecr.<region>.amazonaws.com/async-calendar/backend:latest ./backend
   docker build -t <your-account-id>.dkr.ecr.<region>.amazonaws.com/async-calendar/frontend:latest ./frontend

   # Push images
   docker push <your-account-id>.dkr.ecr.<region>.amazonaws.com/async-calendar/backend:latest
   docker push <your-account-id>.dkr.ecr.<region>.amazonaws.com/async-calendar/frontend:latest
   ```

3. **Create an RDS Database**

   ```bash
   aws rds create-db-instance --db-instance-identifier async-calendar-db --db-instance-class db.t3.micro --engine postgres --allocated-storage 20 --master-username postgres --master-user-password <your-password> --db-name asynccalendar
   ```

4. **Create ECS Cluster, Task Definitions, and Services**

   Use the AWS Console or CloudFormation to create:
   - ECS Cluster
   - Task Definitions for backend and frontend
   - ECS Services
   - Load Balancer
   - Security Groups

## Cost Estimation

| Service | Option | Estimated Monthly Cost |
|---------|--------|------------------------|
| Lightsail Container Service (Small) | 1 | $7 |
| Lightsail Database (Micro) | 1 | $15 |
| **Total for Option 1** | | **$22** |
| Elastic Beanstalk (t3.micro) | 2 | $15 |
| RDS (db.t3.micro) | 2 | $15 |
| **Total for Option 2** | | **$30** |
| ECS Fargate (0.5 vCPU, 1GB) | 3 | $20 |
| RDS (db.t3.micro) | 3 | $15 |
| Load Balancer | 3 | $16 |
| **Total for Option 3** | | **$51** |

*Note: These are approximate costs and may vary based on usage and AWS pricing changes.* 