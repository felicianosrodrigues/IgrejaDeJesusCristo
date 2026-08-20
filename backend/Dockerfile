FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
# Adicione isso antes do RUN pip install
RUN apt-get update && apt-get install -y gcc libpq-dev
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -v -r /app/requirements.txt
COPY . /app

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
