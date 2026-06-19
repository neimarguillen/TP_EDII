import serial
import threading
from datetime import datetime

PUERTO = 'COM3'
BAUDIOS = 9600
NOMBRE_ARCHIVO = 'datos_rpm.txt'

try:
    pic = serial.Serial(PUERTO, BAUDIOS, timeout=1)
    print(f"Conectado al {PUERTO}.")
    print(f"Escribiendo datos en '{NOMBRE_ARCHIVO}' en tiempo real.")
    print("Comandos disponibles:")
    print("  SET_MIN=X  ->  actualiza el límite inferior de las RPM en el PIC")
    print("  SET_MAX=X  ->  actualiza el límite superior de las RPM en el PIC")
    print("Presioná Ctrl+C para salir.\n")
except Exception as e:
    print(f"Error al conectar: {e}")
    exit()

#docstring de la función 
def escuchar_comandos(): 
    """
    Hilo paralelo que escucha comandos del usuario en el CMD.
    Protocolo hacia el PIC:
      SET_MIN=X  ->  manda 'A' + str(X) + '\n'
      SET_MAX=X  ->  manda 'B' + str(X) + '\n'
    El PIC recibe byte a byte en su ISR_UART_RX y actualiza MIN_RPM o MAX_RPM.
    """
    while True:
        try:
            cmd = input()
            cmd = cmd.strip()

            if cmd.upper().startswith("SET_MIN="):
                partes = cmd.split("=")
                if len(partes) == 2 and partes[1].strip().isdigit():
                    valor = partes[1].strip()
                    pic.write(f"A{valor}\n".encode('utf-8'))
                    print(f"[CMD] MIN_RPM actualizado a {valor}")
                else:
                    print("[CMD] Formato inválido. Usá: SET_MIN=X (ej: SET_MIN=5)")

            elif cmd.upper().startswith("SET_MAX="):
                partes = cmd.split("=")
                if len(partes) == 2 and partes[1].strip().isdigit():
                    valor = partes[1].strip()
                    pic.write(f"B{valor}\n".encode('utf-8'))
                    print(f"[CMD] MAX_RPM actualizado a {valor}")
                else:
                    print("[CMD] Formato inválido. Usá: SET_MAX=X (ej: SET_MAX=25)")

            elif cmd == "":
                pass  # Ignoro líneas vacías

            else:
                print("[CMD] Comando no reconocido.")
                print("      Usá: SET_MIN=X  o  SET_MAX=X")

        except EOFError:
            break
        except Exception as e:
            print(f"[CMD] Error: {e}")
            break


# Arranco el hilo de comandos como daemon para que cierre junto al programa
hilo_cmd = threading.Thread(target=escuchar_comandos, daemon=True)
hilo_cmd.start()

# Abro append para no borrar datos anteriores
with open(NOMBRE_ARCHIVO, 'a', encoding='utf-8') as archivo:
    ahora = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    archivo.write(f"\n--- Inicio de registro: {ahora} ---\n")
    archivo.flush()

    while True:
        try:
            # readline() espero hasta recibir '\n' del PIC (los 3 dígitos + carry return + enter)
            linea = pic.readline().decode('utf-8', errors='ignore').strip()

            if linea:
                # Muestro en pantalla las RPM
                print(f"RPM: {linea}")

                # Guardo en el archivo el valor de las RPM
                archivo.write(f"{linea}\n")

                # flush() escritura inmediata sin esperar buffer
                archivo.flush()

        except KeyboardInterrupt:
            print("\nCerrando conexión y guardando archivo...")
            pic.close()
            break
        except Exception as e:
            print(f"[ERROR] {e}")
            pic.close()
            break