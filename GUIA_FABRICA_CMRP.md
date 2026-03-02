# 🏭 Guía de Ejecución: Construcción de CMRP Mastery

Como **Cerebro de la Fábrica**, tu rol es supervisar. El **Agente de Código (Claude)** será quien ensamble las piezas. Sigue estos pasos exactos basándote en el `GEMINI.md`:

## Fase 1: El Blueprint (PRP)
Antes de escribir una sola línea de código, necesitamos el plano técnico. 

1.  **Instrucción al Agente**:
    > "Claude, basándote en el `BUSINESS_LOGIC_CMRP.md` y `ANALISIS_CMRP.md`, ejecuta el comando `/generar-prp` para crear el blueprint técnico de la feature `simulation`. Necesito que definas la estructura de tablas de Supabase y los componentes base de Next.js."
2.  **Acción**: Revisa el archivo que genere en `.claude/PRPs/cmrp-mastery.md`. Si te gusta, dale el OK.

---

## Fase 2: Infraestructura (Supabase)
Una vez tengas el PRP, el agente debe preparar la base de datos.

1.  **Instrucción al Agente**:
    > "Crea las migraciones de Supabase especificadas en el PRP. Usa el Supabase MCP para aplicar los cambios a la base de datos y asegúrate de habilitar RLS (Row Level Security) para proteger mis datos de estudio."

---

## Fase 3: Ensamblaje (Código)
Aquí es donde la fábrica cobra vida. Aplicaremos la arquitectura Feature-First.

1.  **Instrucción al Agente**:
    > "Ejecuta el comando `/ejecutar-prp` para el archivo `.claude/PRPs/cmrp-mastery.md`. Comienza por crear los servicios en `src/features/simulation/services/` y luego los hooks."
2.  **Verificación**: Pídele que ejecute `npm run typecheck` después de cada archivo creado para asegurar que no hay errores de TypeScript.

---

## Fase 4: Control de Calidad (Uso de Ojos)
Usa los "ojos" de la fábrica (Playwright) para ver cómo queda.

1.  **Instrucción al Agente**:
    > "Crea la página de simulación en `src/app/(main)/simulation/page.tsx` y usa el MCP de Playwright para tomar una captura de pantalla y mostrarme cómo se ve el cronómetro y la primera pregunta."

---

## 🛠️ Comandos de Supervivencia
- Si el código falla: Pide **"Auto-Blindaje"**. El agente debe documentar el error en `ANALISIS_CMRP.md` y arreglarlo.
- Si el stack no es el correcto: Recuérdale el **"Golden Path"** de `GEMINI.md`.

---
**¿Listo para dar la primera orden?** Pídele que empiece con la **Fase 1** (Generar el PRP).
