# Capital personal y división automática de cuentas

Los gastos nuevos tienen **Capital personal (reembolsable)** seleccionado por
defecto. El socio indicado en **Quién paga** es dueño del adelanto. Si el pago
salió de fondos del negocio, selecciona **Dinero de la empresa**. La fuente y
el socio se guardan en el movimiento; editar un pago existente no lo duplica.
Los registros antiguos sin fuente conservan su tratamiento hasta editarlos.

## Resumen

Solo muestra dinero disponible en cada cuenta y la transferencia sugerida.
La transferencia compensa el capital personal de cada socio y divide el saldo
compartido 50/50. No hay avisos ni bloqueos por capital personal pendiente.
Registrar la transferencia sigue requiriendo confirmar que se realizó.

Ejemplo desde cero: Frank paga $200.000 y Cristian cobra $1.000.000. Se sugiere
**Cristian transfiere $600.000 a Frank**. Después quedan $600.000 en cuenta de
Frank ($200.000 personales más $400.000 compartidos) y $400.000 de Cristian.
Volver a calcular no repite la transferencia. No se mueven fondos bancarios.

Transferir entre las cuentas cambia dónde está el dinero, no quién es su dueño.
El capital sigue identificado dentro del saldo del socio. Al usar **Retirar
dinero**, primero se registra la devolución de su capital y luego la utilidad.
La utilidad ya retirada se recuerda para no volver a pagarla en el reparto.
Si falta liquidez, la sugerencia se limita al dinero disponible; el resto del
capital personal sigue identificado para futuros cobros, sin bloquear el reparto.

## Estadísticas y movimientos

Estadísticas muestra por socio: capital personal aportado, devuelto y aún en
cuentas. Movimientos y CSV identifican el origen del gasto. La categoría
**Devolución de capital personal** permite también registrar devoluciones
separadas o parciales. Estas devoluciones no duplican el gasto ni la utilidad.
Los aportes societarios de **Aporte de Capital** conservan su tratamiento previo.

## Historial y validación

Los pagos anteriores al corte de apertura del motor (12 de julio de 2026, 19:02)
requieren conciliación antes de reclasificarse. No hay reclasificaciones masivas.
La validación impide devolver más de lo aportado o más dinero que el disponible.
Cerrar un proyecto conserva el capital personal y utiliza la misma sugerencia
de transferencia que el resumen y el reporte.

## Pruebas

- `node tests/finance-engine.test.js`: ambos socios, caja cero, aportes de ambos,
  liquidez insuficiente, devolución parcial, transferencia combinada, archivo,
  cierre, repetición del cálculo y retiro sin duplicar devoluciones o utilidades.
- `python tests/finance-personal-capital-ui.py`: creación, edición, recuperación
  del registro guardado, desglose solo en Estadísticas, transferencia de $600.000
  y retiro automático, sin errores de navegador ni desbordamiento en 390, 1366
  y 1920 píxeles. Firebase está simulado y las conexiones externas bloqueadas;
  no escribe en cuentas reales ni demuestra reglas de Firestore de producción.
