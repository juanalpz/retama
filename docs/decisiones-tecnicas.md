# Arquitectura y Decisiones Técnicas - Retama

Este documento detalla la arquitectura, el stack tecnológico y las convenciones del marketplace inmobiliario Retama (Pinamar, Buenos Aires).


## 1. Stack Tecnológico (Backend Core)

* **Lenguaje & Runtime:** [Node.js + TypeScript] para garantizar tipado estático, autocompletado avanzado y detección de errores en compilación.
* **Framework Web:** [Express.js], elegido por su flexibilidad, manejo de middlewares y ecosistema robusto.
* **Base de Datos Relacional:** [PostgreSQL], seleccionada por su integridad referencial y soporte nativo de JSONB para atributos dinámicos (amenities, galerías de fotos).
* **ORM & Migraciones:** [Prisma ORM], para modelado de datos type-safe, migraciones automatizadas y consultas relacionales eficientes.


## 2. Seguridad (SDLC-S)
* **Protección de Datos y Accesos:** Hashing de contraseñas con bcrypt + salt, HTTPS obligatorio (SSL/TLS) y control de acceso basado en roles (RBAC) restrictivo para el panel de administración.
* **Código Seguro (OWASP Top 10):** Consultas parametrizadas vía ORM contra inyección SQL, sanitización de inputs y escape HTML contra XSS, y rate limiting en formularios expuestos para mitigar fuerza bruta y spam.
* **Infraestructura & Despliegue:**
- **Security by Design & Shift-Left:** Definición previa de controles de acceso y análisis estático de código (SAST) en CI/CD.
- **Aislamiento & Microsegmentación:** Separación total de entornos (Dev/Staging/Prod) y base de datos alojada en subred privada sin exposición pública.
- **Gestión de Secretos:** Llaves de API y credenciales gestionadas en variables de entorno (.env), excluidas estrictamente del repositorio.


## 3. Patrón de Arquitectura
Se adopta una Arquitectura en Capas (Layered Architecture) modular dentro de backend/src/ para mantener el desacoplamiento, la testeabilidad y la mantenibilidad del código.