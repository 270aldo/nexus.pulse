# Secuencia de comunicaciones para upgrade a GENESIS

Este plan define emails, notificaciones y comparativas in-app para impulsar upgrades desde Pulse Lite hacia GENESIS basados en hitos de uso y señales de intención.

## 1) Emails y notificaciones por hitos

| Hito | Disparador | Mensaje clave | CTA | Frecuencia/Notas |
| --- | --- | --- | --- | --- |
| **Onboarding + 3 días** | 2+ logs y ≥1 integración conectada | "Ya estás construyendo hábitos: GENESIS te arma un plan semanal personalizado con coach humano." | CTA: Explorar GENESIS | Notificación in-app + email breve.
| **7 días de adherencia** | 7 días consecutivos con logs de rutina/sueño/actividad | "Lograste una semana completa. GENESIS activa planes dinámicos y feedback humano para evitar estancarte." | CTA: Reservar demo o probar 7 días | Email con historias de éxito + push opcional.
| **Límite cercano** | 80% del límite de logs o almacenamiento de métricas | "Estás por alcanzar el límite en Pulse Lite; GENESIS mantiene historial ilimitado y reportes detallados." | CTA: Upgrade inmediato | Banner persistente + push si >90%.
| **Integración avanzada** | Conecta wearables premium o APIs empresariales | "Tus integraciones de alto valor están listas. Desbloquea flujos automatizados y soporte humano 24/7 en GENESIS." | CTA: Activar GENESIS | Email + modal contextual tras completar la integración.
| **Reactivación** | 7 días sin actividad tras haber llegado a 7 días de adherencia histórica | "Tu progreso merece continuidad. GENESIS te envía planes semanales y accountability con coaches." | CTA: Volver con GENESIS | Email + push suave con horario preferido del usuario.

### Estructura de los mensajes
- **Asunto/heading**: resaltar logro concreto ("Semana completa", "Integración avanzada lista").
- **Valor diferencial**: planes personalizados dinámicos + soporte humano (coach/concierge).
- **Prueba social**: mini-testimonio ("Usuarios con 7 días de adherencia ven 18% más constancia al migrar a GENESIS").
- **CTA claro**: "Probar GENESIS", "Reservar demo" o "Upgrade inmediato".

## 2) Comparativas in-app: Pulse Lite vs GENESIS

- Ubicación: dashboard principal y modales post-hito (7 días, límite alcanzado, nueva integración).
- Formato: tarjeta compacta o acordeón con 3 filas clave.

| Feature | Pulse Lite | GENESIS | Tratamiento UI |
| --- | --- | --- | --- |
| Planes personalizados | Planes básicos, manuales | Planes dinámicos adaptados a hábitos + IA + revisión humana semanal | Badge "Automático" y texto secundario con próximo ajuste estimado.
| Soporte humano | FAQ y comunidad | Coach/concierge humano 24/7 con SLA de 4h | Pill verde "Humano" + botón "Hablar con un coach" (abre chat/agenda).
| Límites | Límite de logs e integraciones básicas | Historial ilimitado + integraciones premium (HRV, labs, API) | Barra de progreso de uso en Lite y check verde en GENESIS.

### Microcopys sugeridos
- "GENESIS ajusta tu plan cada semana según tus logs y bioseñales."
- "Accede a un coach humano cuando notes fatiga o estancamiento."
- "Sin límites de métricas ni integraciones: mantén tu historial completo." 

## 3) Ofertas de upgrade por actividad o límites

- **Alta actividad**: si el usuario crea ≥5 logs/día por 3 días seguidos o añade 2+ integraciones en 48h, mostrar modal "Lleva tu ritmo a GENESIS" con oferta temporal (ej. 7 días trial) y CTA de upgrade directo.
- **Límites alcanzados**: al llegar al 100% del cupo de logs o historial, bloquear el siguiente log con modal explicativo y botón de upgrade; ofrecer exportación parcial solo tras upgrade.
- **Uso avanzado de integraciones**: detectar eventos de wearables avanzados o API externa → banner en timeline "Automatiza este flujo con GENESIS" y CTA de upgrade inmediato.
- **Experimentos A/B**: variar CTA ("Probar 7 días" vs "Upgrade inmediato") y ubicación (banner vs modal) para medir conversión en usuarios de alta actividad.

## 4) Orquestación y frecuencia

- Limitar a 2 notificaciones push por semana y 3 emails/mes por usuario; priorizar hitos de adherencia y límites.
- Enviar recap semanal para quienes ya recibieron invitación a GENESIS pero no convirtieron, destacando progreso + comparación Lite vs GENESIS.
- Sincronizar con soporte humano: abrir ticket interno cuando un usuario con alta actividad ignore 2 invitaciones → outreach manual.

## 5) Métricas de éxito

- Tasa de conversión por hito (7 días, límite 90%, integración avanzada).
- Click-through en comparativas Lite vs GENESIS.
- Tiempo a upgrade después de alcanzar límite.
- Retención post-upgrade (30 y 60 días) comparando cohortes con y sin apoyo humano.

