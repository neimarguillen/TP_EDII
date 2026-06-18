<h1 align="center"> TRABAJO PRÁCTICO FINAL ELECTRÓNICA DIGITAL II </h1>

<p align="center">
<img src="https://github.com/user-attachments/assets/02acabe9-fd17-495c-8be2-d1a68ed70b38" alt="LOGO_SIMOR" width="260">
</p>

<h1 align="center"> Sistema de Monitoreo Respiratorio </h1>

# Índice

- [Descripción del proyecto](#descripción-del-proyecto)
- [Alcance del proyecto](#alcance-del-proyecto)
- [Posibles etapas siguientes y trabajo futuro](#posibles-etapas-siguientes-y-trabajo-futuro)
- [Arquitectura del sistema](#arquitectura-del-sistema-hardware-y-software)
- [Arquitectura de software](#arquitectura-de-software)
- [Especificaciones eléctricas, alimentación y entorno](#especificaciones-eléctricas-alimentación-y-entorno)
- [Proceso de integración y desarrollo](#proceso-de-integración-y-desarrollo)
- [Ensayos, pruebas y resultados](#ensayos-pruebas-y-resultados)

## Descripción del proyecto

SIMOR (Sistema de Monitoreo Respiratorio) es un dispositivo electrónico basado en un microcontrolador PIC16F887, diseñado para medir e indicar en tiempo real el ritmo de respiración de un paciente. El principio de funcionamiento se basa en un único sensor térmico, correspondiente a un termistor NTC, ubicado en la zona de exhalación.

Al alimentar el sistema, el microcontrolador realiza una lectura inicial automática para registrar la temperatura ambiente como valor de referencia. A partir de allí, cada vez que ocurre una exhalación, el sistema detecta el incremento de temperatura por encima de la referencia y registra un evento respiratorio. El circuito contabiliza de forma continua estas señales para calcular las respiraciones por minuto (RPM), mostrando el resultado localmente a través de tres displays de 7 segmentos de cátodo común.

Además de la indicación numérica, el sistema evalúa la condición respiratoria del paciente y la clasifica en tres estados clínicos: frecuencia normal, bradipnea (frecuencia respiratoria inferior al rango establecido) y taquipnea (frecuencia respiratoria superior al rango establecido). Cada estado se representa visualmente mediante el encendido de diodos LED de diferentes colores (verde, amarillo y rojo) y mediante el posicionamiento angular de un servomotor, proporcionando una indicación rápida del estado del paciente.

El sistema incorpora comunicación serial UART bidireccional, permitiendo el intercambio de datos entre el microcontrolador y una computadora. A través de esta interfaz es posible visualizar información del sistema y modificar los límites de frecuencia respiratoria utilizados para la clasificación clínica, otorgando flexibilidad para su adaptación a distintos escenarios de monitoreo.

## Alcance del proyecto

El sistema es capaz de:

- **Detectar las respiraciones:** SIMOR mide la frecuencia respiratoria utilizando un sensor analógico de aliento (NTC), detectando variaciones por encima de un umbral respecto a una lectura base (temperatura ambiente) tomada al inicio del programa.
- **Calcular y visualizar:** SIMOR contabiliza las respiraciones y calcula las respiraciones por minuto (RPM) exactas, tras un ciclo de 60 segundos, mostrando el resultado en 3 displays de 7 segmentos.
- **Clasificar el estado vital:** SIMOR evalúa las RPM calculadas respecto a límites configurables y, en base a ello, determina uno de tres estados posibles: normal, bradipnea/bajo o taquipnea/alto (diodos verde, amarillo y rojo, respectivamente).
- **Accionamiento físico:** SIMOR controla la posición de un servomotor mediante modulación de ancho de pulso (PWM) establecida en software, moviéndolo a 90°, 0° o 180° (estado normal, bradipnea y taquipnea, respectivamente) según corresponda.
- **Comunicación bidireccional UART:** SIMOR envía y recibe datos a través de un protocolo de comunicación serie establecido en software.
  - **Transmisión:** envía el valor de las RPM calculadas por el puerto serie cada minuto. Un programa desarrollado en Python recibe los datos en tiempo real, los muestra en pantalla y los almacena en un archivo de texto para su posterior análisis en una aplicación de escritorio desarrollada en JavaScript.
  - **Recepción:** permite enviar comandos desde la computadora al microcontrolador para modificar los límites mínimo y máximo de las RPM, sin necesidad de reprogramar el dispositivo.
- **Reinicio manual:** SIMOR cuenta con un botón de accionamiento manual que permite reiniciar los contadores, apagar los LEDs y devolver el sistema al estado normal.

El sistema no es capaz de:

- **Almacenar datos:** SIMOR no guarda un registro de las lecturas pasadas en memoria no volátil. Una vez transcurrido el minuto y reiniciado el cálculo, los datos anteriores se descartan del microcontrolador.
- **Actualizar y transmitir en tiempo real continuo:** el cálculo de la frecuencia respiratoria y el envío de datos por UART no se actualizan con cada respiro; SIMOR espera a que transcurra un minuto completo para entregar y transmitir el dato final.
- **Calibrar dinámicamente o seguir la línea base:** la referencia del sensor se toma de forma estática una sola vez durante el encendido del equipo y no se ajusta automáticamente si el ambiente cambia o si el sensor sufre deriva con el uso continuo.

## Posibles etapas siguientes y trabajo futuro

A futuro, se busca implementar las siguientes mejoras:

- Migración del circuito implementado en protoboard a un circuito impreso (PCB), con el fin de volver más robusto al sistema físico frente a entornos clínicos.
- Implementación de modos de bajo consumo para que el monitor pueda operar de forma portátil, sin requerir fuente de alimentación externa.
- Implementación de almacenamiento que permita registrar el historial respiratorio del paciente durante toda la noche con sellos de fecha y hora, facilitando el diagnóstico de trastornos como la apnea del sueño sin necesidad de una PC conectada permanentemente.

## Arquitectura del sistema: hardware y software

### Hardware e interconexión

El sistema tiene como componente principal un microcontrolador PIC16F887, el cual actúa como unidad de control y se encarga de interconectar los distintos bloques circuitales que conforman el hardware del sistema, tales como:

- **Sensor de temperatura:** se utilizó un termistor NTC conectado como entrada analógica AN1 en el pin RA1 del puerto A. De esta forma, el PIC puede medir los cambios de voltaje al ocurrir una exhalación.
- **Segmentos y botón de reset:** ubicados en el puerto B, que cumple una doble función. El pin RB0 se configuró como entrada para el pulsador de reinicio, encargado de restablecer el contador de respiraciones y el período de conteo. Los pines RB1 a RB7 se utilizan para controlar los segmentos de los tres displays, determinando cuáles deben activarse para representar cada dígito.
- **Displays y comunicación:** en el puerto C, los pines RC0, RC1 y RC2 habilitan cada uno de los tres displays de 7 segmentos, lo que permite el multiplexado para la visualización del número de RPM. Por otra parte, los pines RC6 y RC7 se emplean para la comunicación serie con la computadora, permitiendo transmitir las RPM medidas y recibir nuevos valores de configuración para los límites de operación.
- **LEDs y servomotor:** los pines RD0, RD1 y RD2 controlan los LEDs (verde, amarillo y rojo, respectivamente) que indican el estado del paciente. El pin RD3 se utiliza para enviar los pulsos de control al servomotor, el cual además necesita una fuente externa para alimentarse y evitar ruido y fallas por cortocircuito.

Se ilustra a continuación el diagrama de bloques considerando el microcontrolador mencionado.

<p align="center">
<img width="751" height="409" alt="Diag_bloques" src="https://github.com/user-attachments/assets/60d5fc29-972c-4ffd-9cab-7b21f96dc4c3" />
</p>

<p align="center">
<i>Diagrama de bloques de SIMOR.</i>
</p>

### Esquemático del circuito

<p align="center">
<img width="1165" height="483" alt="ESQUEMATICO_NUEVO" src="https://github.com/user-attachments/assets/2f8822b7-ac2e-4c38-87e3-48dcc127aa0b" />
</p>

<p align="center">
<i>Diagrama esquemático del sistema desarrollado en Proteus.</i>
</p>

### Descripción del circuito y consideraciones de diseño

Para la implementación del circuito se realizaron ciertas consideraciones de diseño a nivel software y hardware. En base a ello, el diseño se divide en las siguientes etapas:

- **TMR0: Multiplexado de displays.** Al utilizar 3 displays y requerir un multiplexado, se considera la frecuencia a la cual no se perciben parpadeos, equivalente a 50 Hz. Utilizando ese valor en forma de período, se obtienen 6,67 ms para cada uno de los displays, valor que se usa como tiempo de desbordamiento del TMR0.

$$
TMR0=
\left[
-\left(
\frac{\dfrac{T(s)}{T_{inst}}-2}{PS}
\right)
\right]
+256
$$

$$
TMR0=
\left[
-\left(
\frac{\dfrac{6.67\times10^{-3}}{10^{-6}}-2}{256}
\right)
\right]
+256
=230
$$

- **TMR1: Multiplexado de displays.** El bloque correspondiente al TMR1 se utiliza como fuente de interrupción para incrementar las respiraciones por minuto (RPM) sensadas por el NTC. En base a ello, se implementa un tiempo de desbordamiento de 0,5 segundos con el uso de un contador en software, para obtener 1 minuto de mediciones por parte del sensor.

$$
TMR1=
-\frac{T(s)\cdot \dfrac{F_{osc}}{4}}{PS}
+65536
=3035
$$

Debido a que TMR1 tiene la capacidad de desbordar hasta 64k, existen 2 registros para asignar el valor previamente calculado: TMR1H y TMR1L. A partir de ello, se precarga el primero con 0x0B (11 en decimal) y el segundo con 0xDB (219 en decimal), obteniendo en consecuencia 0x0BDB, es decir, 3035, como se mencionó.

- **Sensor NTC con ADC.** El NTC es un componente que varía su resistencia con la temperatura, por lo que se utilizó un divisor resistivo para transformar esos cambios en variaciones de voltaje interpretables por el ADC.

Para lograr la conversión a voltaje, se consideró el rango operativo del sensor de acuerdo a distintas temperaturas, siguiendo el gráfico otorgado por su fabricante (curva de 502F3470).

<p align="center">
<img src="https://github.com/user-attachments/assets/6b92ccf7-8880-4552-bead-4e1ce637626d" width="380">
</p>

<p align="center">
<i>Curva característica resistencia-temperatura del sensor MF52A (502F3470).</i>
</p>

El rango de diseño corresponde a 25–40 °C, con valores de resistencia de 5 kΩ y 2 kΩ respectivamente. A partir de ello se calculó el voltaje de salida (Vout) para ambas situaciones: 

$$
\begin{aligned}
25\^{\circ}\mathrm{C}: \qquad
V_{out}
&=
5\,V\cdot
\frac{5\,k\Omega}{5\,k\Omega+5\,k\Omega}=
2.5\,V
\\\\[12pt]
40\^{\circ}\mathrm{C}: \qquad
V_{out}
&=
5\,V\cdot
\frac{5\,k\Omega}{5\,k\Omega+2\,k\Omega}=
3.57\,V
\end{aligned}
$$

Los valores operativos definen el rango de referencia del ADC, calculado como la diferencia entre ambos límites, obteniendo como resultado 1,07 V. Para obtener la resolución del conversor se consideran sus 10 bits, utilizando la fórmula correspondiente al método de aproximaciones sucesivas.

$$
\mathrm{Resolución\ ADC}=
\frac{1.07\,V}{2^{10}}=
1.04\ mV
$$


- **ADC: Valores de Vref+ y Vref−.** Debido a que el sensor NTC detecta cambios en la temperatura del aliento, se utilizaron dos divisores resistivos para fijar valores específicos de tensión al ADC. De esta forma, el rango del conversor se reduce (pasando de 0–5 V a 2,5–3,57 V), lo que permite un mejor funcionamiento del sensor al aumentar la resolución de la conversión.

Para el caso de 2,5 V se utilizaron dos resistencias de 10 kΩ; este divisor se emplea para fijar el valor de Vref− en lugar de 0 V. Para el caso de 3,57 V se utilizaron resistencias de 12 kΩ y 4,7 kΩ, con el fin de fijar Vref+ en lugar de 5 V.

- **UART: Velocidad de Baudaje.** Para la transmisión y recepción de datos se utiliza una comunicación asíncrona, por lo que se estableció una velocidad de 9600 baudios (bits por segundo), lo que permite generar una comunicación bidireccional entre el microcontrolador y la PC.

Se considera BRGH = 1 y se obtiene la siguiente fórmula otorgada por el fabricante en su hoja de datos:

$$
SPBRG=\frac{F_{osc}}{16\cdot Baud}-1
$$

$$
SPBRG=
\frac{4\times10^{6}}{16\cdot9600}-1 =
25.04
\approx25
$$

*Verificación:*

$$
Baud_{real}
=\frac{4\times10^{6}}
{16\cdot(25+1)}=
9615\ \mathrm{bps}
$$

$$
Error=
\frac{9615-9600}{9600}=
0.16\%
$$

## Arquitectura de software

El firmware está desarrollado en lenguaje Ensamblador, basándose en una arquitectura manejada por interrupciones. En el lazo principal, el sistema realiza continuamente conversiones ADC para calcular la diferencia térmica y determinar si existe respiración por encima de un umbral preestablecido.

## Diagramas de Flujo

***Programa principal***
<p align="center">
<img src="https://github.com/user-attachments/assets/69b1fe4c-8ff3-473e-b04c-729aafca389b" width="500">
</p>

***Rutina de interrupción TMR0***
<p align="center">
<img src="https://github.com/user-attachments/assets/593d5df3-5569-4d64-a542-2a12ac1e84f0" width="500">
</p>

***Rutina de interrupción TMR1***
<p align="center">
<img src="https://github.com/user-attachments/assets/f0288116-08bf-4768-b3ae-1ac1f1a9f409" width="500">
</p>

***Comunicación UART***
<p align="center">
<img width="448" height="453" alt="ISB_UART" src="https://github.com/user-attachments/assets/cc788c7b-152a-4859-bf01-a3bd3c8fe70c" />
</p>

***Interrupción por cambio en RB0***
<p align="center">
<img src="https://github.com/user-attachments/assets/dd6a5c97-aa5d-4564-aa49-dbbc64e0c2f0" width="500">
</p>

## Especificaciones eléctricas, alimentación y entorno

### Parámetros de alimentación y consumo

- **Tensión de operación del sistema:** 5 V (compatible con el PIC16F887 y con el servomotor).
- **Método de alimentación:** módulo USB-UART CP2101 y fuente de alimentación de 5 V.
- **Consumo estimado:** El consumo del circuito no corresponde a un valor fijo, sino que varía constantemente. Esto se debe principalmente al multiplexado de los displays, el cual enciende y apaga los segmentos varias veces por segundo, luego intervienen las LEDs de estado (verde, amarillo y rojo), las cuales se encienden o apagan según el estado evaluado. Otros factores a tener en cuenta corresponden al servo, el cual consume más que cuando se encuentra en movimiento activo y el propio PIC, que posee pequeñas variaciones de consumo según las instrucciones que se ejecuten. Al realizar la medición del consumo de corriente estimado, se conectó un multímetro en serie con la fuente de alimentación (USB UART) y el circuito. El valor corresponde al rango de 1,2 mA y 1,8 mA, siendo de operación normal.
- **Herramientas de software:** MPLAB X IDE v5.01 y compilador AN1310 v1.05.
- **Hardware de programación/depuración:** PICkit 3.

<p align="center">
<img src="https://github.com/user-attachments/assets/17a8e6e1-a946-4d29-abeb-ebce81ec5919" width="500">
</p>
<p align="center">
<i>Medición del consumo energético.</i>
</p>

**Configuración de bits:**

- **Oscilador (`_FOSC_XT`):** configurado para trabajar con un cristal externo de 4 MHz, lo que proporciona una base de tiempo estable y precisa, fundamental para los módulos de comunicación serie y temporización.
- **Watchdog Timer (`_WDTE_OFF`):** deshabilitado para evitar reinicios involuntarios del microcontrolador durante la ejecución de retardos prolongados o bucles de control en el firmware.
- **Master Clear (`_MCLRE_ON`):** pin RE3 configurado como entrada de reset externo por hardware. Para asegurar un correcto arranque y protección frente a ruido, se conecta físicamente una resistencia de pull-up de 10 kΩ a la línea de 5 V.
- **Protecciones de tensión (`_BOREN_ON` y `_LVP_OFF`):** se habilita el Brown-out Reset (BOR) para resetear el dispositivo ante caídas en el voltaje de alimentación. Asimismo, se deshabilita la programación en bajo voltaje (LVP) para liberar el pin RB3 para uso general y evitar reprogramaciones accidentales.

**Periféricos internos utilizados:**

- **ADC:** configurado en AN1, con justificación izquierda, tomando los 8 bits más significativos del registro ADRESH, lo que cumple con la resolución necesaria para las lecturas del sensor NTC.
- **Timer0 (TMR0):** utilizado para temporizar el multiplexado de los displays de 7 segmentos, configurado con prescaler interno 1:256 para garantizar una frecuencia de visualización suficiente.
- **Timer1 (TMR1):** configurado con prescaler 1:8 (mediante los registros TMR1H:TMR1L) para generar interrupciones cada 0,5 segundos. Un contador de software acumula 120 ciclos para completar el minuto necesario para el cálculo de las RPM.
- **EUSART (módulo serie):** configurado en modo asincrónico bidireccional a 9600 baudios, con Fosc = 4 MHz (SPBRG = 25, BRGH = 1). Para asegurar la mínima tasa de error en la transmisión, se definieron los valores de registro SPBRG = 25 y BRGH = 1 (modo alta velocidad).

**Gestión de interrupciones:**

Al contar con un único vector de interrupciones, se implementa un esquema de prioridad por software (polling) dentro de la ISR. El orden establecido corresponde a:

1. **TMR0IF (Timer0):** prioridad para el multiplexado de displays, debido al corto período que posee.
2. **TMR1IF (Timer1):** prioridad secundaria, para el tiempo de adquisición (base de tiempo del cálculo de RPM).
3. **RBIF (interrupción por cambio en PORTB):** atiende el pulsador de reset manual conectado a RB0.
4. **RCIF (recepción UART):** monitorea la llegada de bytes de configuración externa. Se ubica al final porque el buffer de hardware de la UART tolera el tiempo de espera mínimo impuesto por las rutinas anteriores, sin perder datos.

Con el fin de garantizar el correcto funcionamiento de los elementos de visualización y limitar las corrientes de operación a valores seguros, tanto para el microcontrolador como para los elementos de circuito asociados, se dimensionaron las resistencias correspondientes a los segmentos y a las etapas de multiplexado de los displays de 7 segmentos. También se determinaron las resistencias limitadoras de corriente para los LEDs, considerando las caídas de tensión de cada modelo y las corrientes establecidas en el diseño.

**Resistencia para cada segmento**

La resistencia asociada a cada segmento se calculó a partir de la tensión de alimentación, la caída de tensión del LED del display y la caída en saturación del transistor. Se fijó una corriente de segmento de 7 mA, obteniéndose:

$$
V_{DD}-V_{CE(sat)}-V_D-I_D\cdot R_D=0
$$

$$
R_D=
\frac{5V-0.2V-2V}
{7\,mA}=
400\,\Omega
\approx470\,\Omega
$$

**Resistencia para cada display**

La corriente de base necesaria para llevar al transistor a saturación se determinó considerando un factor de ganancia β = 30, obtenido experimentalmente en el circuito implementado.

$$
V_{OH}-I_b\cdot R_b-V_{BE}=0
$$

$$
R_b=
\frac{(5-0.7)\,V\cdot30}
{4\cdot7\,mA}=
6.14\,k\Omega
$$

**Cálculo de resistencias para LEDs**

Las resistencias limitadoras para los LEDs se calcularon a partir de sus respectivas caídas de tensión directa y de la corriente de operación deseada, obteniéndose los siguientes valores comerciales:

$$
R_{Rojo}=\frac{V_{Rojo}}
{I_D}=
220\ \Omega
$$

$$
R_{Amarillo}=\frac{V_{Amarillo}}
{I_D}=
220\ \Omega
$$

$$
R_{Verde}=\frac{V_{Verde}}
{I_D}=
330\\Omega
$$

## Proceso de integración y desarrollo

El diseño y la programación del sistema se llevaron a cabo de forma progresiva, dividiendo el trabajo en cuatro etapas principales de desarrollo:

1. **Validación inicial:** se configuró el oscilador externo del microcontrolador y se implementó el TMR0 como fuente de interrupción. A través de este temporizador y el uso de tablas de conversión, se logró programar el encendido y apagado rápido de los displays, es decir, el multiplexado, consiguiendo que el sistema muestre números fijos de forma clara y sin parpadeos visuales.
2. **Entradas analógicas y lógica de conteo:** se activó el módulo ADC para que el chip pueda leer el sensor de temperatura. Se programó el sistema para que guarde una lectura del ambiente al arrancar y se diseñó la lógica que detecta cada exhalación del paciente. Para evitar que el ruido del sensor genere falsos conteos, se sumó un retardo de medio segundo que actúa como filtro anti-rebote cada vez que se registra una respiración. También se implementaron los 2 divisores resistivos para fijar las tensiones de referencia.
3. **Base de tiempo e integración de la transmisión serie:** se incorporó el TMR1 para medir un minuto mediante el uso de contadores. Se implementó la división de los valores en unidades, decenas y centenas para enviarlos de forma correcta por el puerto serie una vez cumplido el ciclo del clock.
4. **Control mecánico y lectura de comandos serie:** se programaron los tiempos necesarios para posicionar el servomotor en tres ángulos diferentes según el estado del paciente. Se agregó una rutina de recepción de datos que detecta en tiempo real los mensajes enviados desde la computadora, los traduce y actualiza los límites que indican el estado del paciente.

## Ensayos, pruebas y resultados

### Caracterización del Sensor NTC

Se sometió al NTC a diferentes temperaturas (dentro y fuera del rango permitido), midiendo la tensión en el divisor resistivo con un multímetro digital, lo que permitió validar la curva de respuesta del sensor frente a la lectura del ADC. Se confirmó la variación de temperatura del aliento y la tensión de entrada al pin respectivo (AN1), lo que permitió definir un umbral para la detección de la respiración.

<p align="center">
<img src="https://github.com/user-attachments/assets/02e3bc2c-bef0-43e5-ba07-ddb9beee9369" width="600">
</p>

<p align="center">
<i>Sensado a temperatura ambiente.</i>
</p>

<p align="center">
<img src="https://github.com/user-attachments/assets/0d70f95e-b0b6-4917-ac8f-4b79ddf2d60a" width="600">
</p>

<p align="center">
<i>Sensado a temperaturas fuera del rango de diseño.</i>
</p>

### Comunicación UART

Se verificó el flujo de datos bidireccional entre el microcontrolador y la computadora mediante un script en Python, confirmando la correcta transmisión de las RPM y la respuesta del sistema ante comandos de reconfiguración de umbrales. Se alcanzó una comunicación estable luego de varios intentos, sin pérdida de tramas al utilizar RB0, lo que confirma la correcta configuración del módulo UART y la estabilidad del reloj.

<p align="center">
<img src="https://github.com/user-attachments/assets/eb8f8bd7-6b65-4eeb-bd4b-d7461a5fbd42" width="600">
</p>

<p align="center">
<i>Verificación de la transmisión de datos por UART.</i>
</p>

Una vez lograda la comunicación bidireccional, se implementó un sistema graficador de las RPM para integrar los datos recibidos con los transmitidos. Se utilizó código en Python para fijar los límites permitidos de las mediciones, generando además un archivo de texto que se actualiza periódicamente al recibir los valores sensados.

Luego de varias pruebas, se obtuvo la gráfica que se muestra a continuación:

<p align="center">
<img src="https://github.com/user-attachments/assets/634e309a-e053-4bdf-9f25-82e42c1290d4" width="600">
</p>

<p align="center">
<i>Recepción de datos y forma de onda de las RPM.</i>
</p>

### Evolución del prototipo

A lo largo del proyecto, SIMOR experimentó diversas modificaciones tanto a nivel hardware como software. A continuación se evidencia la evolución física del sistema.
<p align="center">
<img src="https://github.com/user-attachments/assets/c095588d-6130-44f9-a88e-890a42da3815" width="500">
</p>

<p align="center">
<i>Armado primario de SIMOR.</i>
</p>

<p align="center">
<img src="https://github.com/user-attachments/assets/28f4a05b-a7ff-4cc2-a2e9-c6dbe2fcb3d8" width="500">
</p>

<p align="center">
<i>Versión final del armado de SIMOR.</i>
</p>

## Autores

**de la Torre, Guadalupe**

**Fernández Valle, Justo**

**Guillén Mariño, Neimar Sharim**

**Profesor: Marcos Javier Blasco**

Facultad de Ciencias Exactas, Físicas y Naturales - Universidad Nacional de Córdoba

17/06/2026
