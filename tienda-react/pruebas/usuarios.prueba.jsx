import {
    leerUsuarios,
    buscarUsuario,
    crearUsuario,
    actualizarUsuarioAdmin,
    cambiarEstadoUsuario,
    eliminarCuenta
} from '../src/datos/usuarios'

describe('Datos de usuarios', () => {

    beforeEach(() => {
        localStorage.clear()
    })

    it('debe cargar los usuarios base', () => {
        const usuarios = leerUsuarios()

        expect(usuarios.length).toBeGreaterThan(0)

        const admin = usuarios.find(
            (usuario) =>
                usuario.correo === 'admin@gaselvolcan.cl'
        )

        expect(admin).toBeDefined()
        expect(admin.rol).toBe('ADMINISTRADOR')
    })

    it('debe crear un usuario nuevo', () => {
        const resultado = crearUsuario({
            run: '190110222',
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@gmail.com',
            contrasena: '1234',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Chillán',
            direccion: 'Av. Central 123',
            rol: 'CLIENTE'
        })

        expect(resultado.ok).toBeTrue()

        const usuario = buscarUsuario(
            'juan@gmail.com'
        )

        expect(usuario).not.toBeNull()
        expect(usuario.nombre).toBe('Juan')
        expect(usuario.apellidos).toBe('Pérez')
        expect(usuario.rol).toBe('CLIENTE')
        expect(usuario.activo).toBeTrue()
    })

    it('no debe permitir correos repetidos', () => {
        crearUsuario({
            run: '190110222',
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@gmail.com',
            contrasena: '1234',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Chillán',
            direccion: 'Av. Central 123',
            rol: 'CLIENTE'
        })

        const resultado = crearUsuario({
            run: '185552223',
            nombre: 'Pedro',
            apellidos: 'Soto',
            correo: 'juan@gmail.com',
            contrasena: '5678',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Bulnes',
            direccion: 'Calle Dos 456',
            rol: 'REPARTIDOR'
        })

        expect(resultado.ok).toBeFalse()

        expect(resultado.mensaje).toBe(
            'Ya existe un usuario con ese correo.'
        )
    })

    it('debe editar un usuario', () => {
        crearUsuario({
            run: '190110222',
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@gmail.com',
            contrasena: '1234',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Chillán',
            direccion: 'Av. Central 123',
            rol: 'CLIENTE'
        })

        const resultado = actualizarUsuarioAdmin(
            'juan@gmail.com',
            {
                nombre: 'Juan Carlos',
                apellidos: 'Pérez',
                correo: 'juan@gmail.com',
                contrasena: '',
                nacimiento: '',
                region: 'Ñuble',
                comuna: 'Chillán Viejo',
                direccion: 'Nueva dirección 100',
                rol: 'REPARTIDOR'
            }
        )

        expect(resultado.ok).toBeTrue()

        const usuario = buscarUsuario(
            'juan@gmail.com'
        )

        expect(usuario.nombre).toBe('Juan Carlos')
        expect(usuario.apellidos).toBe('Pérez')
        expect(usuario.comuna).toBe('Chillán Viejo')
        expect(usuario.direccion).toBe(
            'Nueva dirección 100'
        )
        expect(usuario.rol).toBe('REPARTIDOR')

        // Si al editar se deja vacía,
        // mantiene la contraseña anterior
        expect(usuario.contrasena).toBe('1234')
    })

    it('debe cambiar el correo desde administración', () => {
        crearUsuario({
            run: '190110222',
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@gmail.com',
            contrasena: '1234',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Chillán',
            direccion: 'Av. Central 123',
            rol: 'CLIENTE'
        })

        const resultado = actualizarUsuarioAdmin(
            'juan@gmail.com',
            {
                nombre: 'Juan',
                apellidos: 'Pérez',
                correo: 'juan2@gmail.com',
                contrasena: '',
                nacimiento: '',
                region: 'Ñuble',
                comuna: 'Chillán',
                direccion: 'Av. Central 123',
                rol: 'CLIENTE'
            }
        )

        expect(resultado.ok).toBeTrue()

        const usuarioAnterior = buscarUsuario(
            'juan@gmail.com'
        )

        const usuarioNuevo = buscarUsuario(
            'juan2@gmail.com'
        )

        expect(usuarioAnterior).toBeNull()
        expect(usuarioNuevo).not.toBeNull()
        expect(usuarioNuevo.correo).toBe(
            'juan2@gmail.com'
        )
    })

    it('no debe cambiar el correo por uno ya utilizado', () => {
        crearUsuario({
            run: '190110222',
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@gmail.com',
            contrasena: '1234',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Chillán',
            direccion: 'Av. Central 123',
            rol: 'CLIENTE'
        })

        crearUsuario({
            run: '185552223',
            nombre: 'Pedro',
            apellidos: 'Soto',
            correo: 'pedro@gmail.com',
            contrasena: '5678',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Bulnes',
            direccion: 'Calle Dos 456',
            rol: 'CLIENTE'
        })

        const resultado = actualizarUsuarioAdmin(
            'juan@gmail.com',
            {
                nombre: 'Juan',
                apellidos: 'Pérez',
                correo: 'pedro@gmail.com',
                contrasena: '',
                nacimiento: '',
                region: 'Ñuble',
                comuna: 'Chillán',
                direccion: 'Av. Central 123',
                rol: 'CLIENTE'
            }
        )

        expect(resultado.ok).toBeFalse()

        expect(resultado.mensaje).toBe(
            'Ya existe un usuario con ese correo.'
        )
    })

    it('debe desactivar un usuario', () => {
        crearUsuario({
            run: '190110222',
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@gmail.com',
            contrasena: '1234',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Chillán',
            direccion: 'Av. Central 123',
            rol: 'CLIENTE'
        })

        cambiarEstadoUsuario(
            'juan@gmail.com'
        )

        const usuario = buscarUsuario(
            'juan@gmail.com'
        )

        expect(usuario.activo).toBeFalse()
    })

    it('debe volver a activar un usuario', () => {
        crearUsuario({
            run: '190110222',
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@gmail.com',
            contrasena: '1234',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Chillán',
            direccion: 'Av. Central 123',
            rol: 'CLIENTE'
        })

        cambiarEstadoUsuario(
            'juan@gmail.com'
        )

        cambiarEstadoUsuario(
            'juan@gmail.com'
        )

        const usuario = buscarUsuario(
            'juan@gmail.com'
        )

        expect(usuario.activo).toBeTrue()
    })

    it('debe eliminar un usuario', () => {
        crearUsuario({
            run: '190110222',
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@gmail.com',
            contrasena: '1234',
            nacimiento: '',
            region: 'Ñuble',
            comuna: 'Chillán',
            direccion: 'Av. Central 123',
            rol: 'CLIENTE'
        })

        eliminarCuenta(
            'juan@gmail.com'
        )

        const usuario = buscarUsuario(
            'juan@gmail.com'
        )

        expect(usuario).toBeNull()
    })

})