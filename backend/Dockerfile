FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instala dependências de sistema necessárias para compilar o "jq", "numpy", etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    g++ \
    libc-dev \
    libffi-dev \
    libjq-dev \
    jq \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt

# Instala as dependências Python
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -v -r /app/requirements.txt

COPY . /app

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]