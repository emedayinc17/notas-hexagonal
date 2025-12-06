FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements from service directory and install
COPY services/personas-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared package and service app
COPY shared/ ./shared/
COPY services/personas-service/app/ ./app/

EXPOSE 8003

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
