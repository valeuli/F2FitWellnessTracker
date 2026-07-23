# Decisiones de arquitectura

Este proyecto se mantuvo intencionalmente simple porque el objetivo es un MVP funcional.

Backend:
- Se eligió FastAPI por su validación automática, OpenAPI integrado y buena ergonomía para un CRUD pequeño.
- SQLAlchemy con SQLite fue suficiente para persistencia local sin requerir infraestructura externa.
- La tabla de bienestar guarda `date` y `timezone` para resolver el día local de forma consistente.
- Se usa `Idempotency-Key` en el `PUT` para evitar duplicados cuando la red reintenta envíos.
- La lógica se separó en router, servicio, repositorio, schemas y mapper para mantener responsabilidades claras.

Frontend:
- React + Vite + TypeScript ofrecen velocidad de desarrollo y una base limpia para una prueba técnica.
- Se priorizó una sola pantalla principal con modal para cumplir el registro en menos de 30 segundos.
- El historial se adapta por breakpoint: tabla en desktop y vista compacta en mobile.
- La sección de historial incluye una gráfica simple de últimos 7 días con Recharts para visualizar tendencia sin complejidad extra.
- La caché/offline local se dejó simple para no introducir complejidad innecesaria.

Decisiones deliberadas:
- No se agregó estado global pesado.
- No se introdujeron microservicios ni colas; el alcance actual no lo necesita.
