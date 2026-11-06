import { useCallback, useEffect, useState } from "react";
import { SesionContexto } from "./sesionContexto";
import { leerSesion, guardarSesion } from "../datos/usuarios";
import { pedir, msHastaVencer } from "../utilidades/api";

// Envuelve a la aplicacion y le dice quien tiene la sesion iniciada.
// Desde la EP3 la sesion es { token, usuario } y la entrega ms-usuarios.
// Mismo patron que ProveedorCarrito: estado + localStorage + Context.

// El token se renueva 1 minuto antes de vencer
const MARGEN_RENOVACION = 60 * 1000;

// Al recargar la pagina: si el token ya vencio, no hay sesion
function sesionVigente() {
  const guardada = leerSesion();
  return guardada?.token && msHastaVencer(guardada.token) > 0 ? guardada : null;
}

// El backend manda nombre y apellidos por separado; el navbar usa el nombre completo.
// Nunca se guarda la contrasena.
function desdeRespuesta({ token, usuario }) {
  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: (usuario.nombre + " " + usuario.apellidos).trim(),
      correo: usuario.correo,
      rol: usuario.rol
    }
  };
}

function ProveedorSesion({ children }) {
  // null significa que nadie ha iniciado sesion
  const [sesion, setSesion] = useState(sesionVigente);

  // Cada vez que cambia la sesion, se guarda (o se borra si es null)
  useEffect(() => {
    guardarSesion(sesion);
  }, [sesion]);

  // Renovacion automatica: se programa cada vez que llega un token nuevo
  useEffect(() => {
    if (!sesion) {
      return;
    }

    const espera = Math.max(msHastaVencer(sesion.token) - MARGEN_RENOVACION, 0);

    const temporizador = setTimeout(async () => {
      try {
        const respuesta = await pedir("/auth/renovar", { metodo: "POST", token: sesion.token });
        setSesion(desdeRespuesta(respuesta));
      } catch {
        // No se pudo renovar (cuenta desactivada, token vencido o sin conexion): se pide entrar de nuevo
        setSesion(null);
      }
    }, espera);

    return () => clearTimeout(temporizador);
  }, [sesion]);

  async function iniciarSesion(correo, contrasena) {
    try {
      const respuesta = await pedir("/auth/login", {
        metodo: "POST",
        cuerpo: { correo: correo.trim(), contrasena }
      });
      const nueva = desdeRespuesta(respuesta);

      setSesion(nueva);
      // El rol se devuelve para que el login sepa a que panel llevar
      return { ok: true, mensaje: "", rol: nueva.usuario.rol };
    } catch (error) {
      // El mensaje viene del backend, por ejemplo "Correo o contraseña incorrectos."
      return { ok: false, mensaje: error.message };
    }
  }

  function cerrarSesion() {
    setSesion(null);
  }

  // Despues de editar el perfil: actualiza el nombre que muestra el navbar
  function actualizarUsuario(cambios) {
    setSesion((actual) => actual && { ...actual, usuario: { ...actual.usuario, ...cambios } });
  }

  // Para las pantallas que llaman a rutas protegidas: agrega el token.
  // Si el backend responde 401 (token vencido o invalido), se cierra la sesion.
  // useCallback: la funcion solo cambia cuando cambia el token, asi las
  // pantallas que la usan en un useEffect no piden los datos una y otra vez.
  const token = sesion?.token;
  const llamarApi = useCallback(async (ruta, opciones = {}) => {
    try {
      return await pedir(ruta, { ...opciones, token });
    } catch (error) {
      if (error.estado === 401) {
        setSesion(null);
      }
      throw error;
    }
  }, [token]);

  const valor = {
    usuario: sesion?.usuario ?? null,
    token: token ?? null,
    iniciarSesion,
    cerrarSesion,
    actualizarUsuario,
    llamarApi
  };

  return (
    <SesionContexto.Provider value={valor}>
      {children}
    </SesionContexto.Provider>
  );
}

export default ProveedorSesion;
