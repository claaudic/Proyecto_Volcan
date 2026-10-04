import { useEffect, useState } from "react";
import { SesionContexto } from "./sesionContexto";
import { buscarCuenta, leerSesion, guardarSesion } from "../datos/usuarios";

// Envuelve a la aplicacion y le dice quien tiene la sesion iniciada.
// Mismo patron que ProveedorCarrito: estado + localStorage + Context.

function ProveedorSesion({ children }) {
  // null significa que nadie ha iniciado sesion
  const [usuario, setUsuario] = useState(leerSesion);

  // Cada vez que cambia la sesion, se guarda (o se borra si es null)
  useEffect(() => {
    guardarSesion(usuario);
  }, [usuario]);

  function iniciarSesion(correo, contrasena) {
    const cuenta = buscarCuenta(correo, contrasena);

    if (!cuenta) {
      return { ok: false, mensaje: "El correo o la contraseña son incorrectos." };
    }

    if (cuenta.activo === false) {
      return { ok: false, mensaje: "Tu cuenta está desactivada. Contacta al administrador." };
    }

    // Se guarda solo lo necesario, nunca la contrasena
    setUsuario({ nombre: cuenta.nombre, correo: cuenta.correo, rol: cuenta.rol });
    return { ok: true, mensaje: "" };
  }

  function cerrarSesion() {
    setUsuario(null);
  }

  return (
    <SesionContexto.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </SesionContexto.Provider>
  );
}

export default ProveedorSesion;
