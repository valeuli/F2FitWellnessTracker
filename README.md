# F2Fit Wellness Tracker

MVP para registrar bienestar físico y emocional diario.

## Stack

- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: React + Vite + TypeScript
- Persistencia local: `f2fit.db`

## Requisitos

- Python 3.12.12
- Node.js 18+ recomendado

## Instalación

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Frontend

```bash
cd frontend
npm install
```

## Ejecutar la aplicación

### Backend

```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

El backend queda disponible en `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

## Tests

### Backend

```bash
cd backend
source .venv/bin/activate
pytest
```

## API

FastAPI genera documentación interactiva automáticamente:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Endpoints principales

- `GET /health`
- `GET /api/wellness/today?date=YYYY-MM-DD`
- `PUT /api/wellness/today`
  - Header requerido: `Idempotency-Key`
- `GET /api/wellness/history?days=7&timezone=America/Bogota`

### Payload de ejemplo

```json
{
  "date": "2024-03-15",
  "physical_energy": 4,
  "emotional_state": 3,
  "notes": "Día productivo",
  "habits": {
    "exercise": true,
    "hydration": true,
    "sleep": false,
    "nutrition": true
  },
  "timezone": "America/Bogota"
}
```

## Notas

- El backend crea la base SQLite automáticamente al iniciar.
- El frontend puede usar `VITE_API_BASE_URL` para apuntar a otro backend.
- El flujo de guardado usa `Idempotency-Key` para evitar duplicados.
- Si reutilizas la misma `Idempotency-Key`, el backend devuelve el registro ya guardado sin aplicar cambios nuevos.
- Para probar cambios de timezone en un `PUT`, usa una `Idempotency-Key` nueva.

## Decisiones de arquitectura

Ver [docs/architecture.md](docs/architecture.md).
