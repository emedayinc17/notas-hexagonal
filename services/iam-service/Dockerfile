FROM python:3.11-slim
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends build-essential gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
# allow service directory to be passed as build-arg
# Copy requirements from service directory and install
COPY services/iam-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared package and service app
COPY shared/ ./shared/
COPY services/iam-service/app/ ./app/

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
