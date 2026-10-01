import { Link } from 'react-router-dom'

// Migrado desde nosotros.html del sitio en HTML.
function Nosotros() {
  return (
    <main>
      <section className="pagina-encabezado" aria-labelledby="titulo-nosotros">
        <div className="encabezado-fondo" aria-hidden="true">
          <span className="luz luz-encabezado-verde"></span>
          <span className="luz luz-encabezado-celeste"></span>
          <span className="encabezado-arco"></span>
        </div>

        <div className="container">
          <nav className="miga" aria-label="Ruta">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Nosotros</span>
          </nav>
          <h1 id="titulo-nosotros">Somos Gas El Volcán</h1>
          <p className="pagina-bajada">Una empresa familiar de la Región de Ñuble, dedicada al gas desde 1998.</p>
        </div>

        <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z"/>
        </svg>
      </section>

      <section className="historia" aria-labelledby="titulo-historia">
        <div className="container historia-contenido" data-revelar>
          <div>
            <span className="linea-marca" aria-hidden="true"></span>
            <h2 id="titulo-historia">Un servicio cercano en Chillán</h2>
            <p className="intro-texto">
              Gas El Volcán nace en 1998 en la ciudad de Chillán, Región de Ñuble,
              con el objetivo de acercar la distribución de gas licuado a los hogares
              y negocios de la zona.
            </p>
            <p className="intro-texto">
              Somos una empresa familiar. Detrás de cada pedido hay personas que conocen
              el territorio y priorizan el trato directo por sobre los procesos impersonales.
            </p>
            <p className="intro-texto">
              Trabajamos con cilindros de distintos formatos y con los accesorios necesarios
              para instalaciones domésticas y comerciales: reguladores, mangueras, abrazaderas
              y equipos de seguridad.
            </p>

            <ul className="datos-par list-unstyled">
              <li className="cifra">
                <p className="cifra-numero">1998</p>
                <p className="cifra-texto">Año de fundación</p>
              </li>
              <li className="cifra">
                <p className="cifra-numero">Ñuble</p>
                <p className="cifra-texto">Zona de cobertura</p>
              </li>
            </ul>
          </div>

          <div className="historia-imagen">
            <span className="hero-piso" aria-hidden="true"></span>
            <img src="/img/familia-local.jpg" alt="La familia dueña de Gas El Volcán frente al local en Chillán, junto al camión de reparto" />
            <div className="hero-insignia">
              <p className="hero-insignia-numero">Empresa familiar</p>
              <p className="hero-insignia-texto">En Chillán desde 1998</p>
            </div>
          </div>
        </div>
      </section>


      <div className="relieve" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" focusable="false">
          <path d="M0 80 L0 48 L96 30 L188 46 L286 22 L384 42 L472 26 L566 44 L664 24 L762 42 L862 28 L960 46 L1072 26 L1172 44 L1272 28 L1362 42 L1440 30 L1440 80 Z"/>
        </svg>
      </div>

      <section className="forma-trabajar" aria-labelledby="titulo-forma">
        <div className="container" data-revelar>
          <span className="linea-marca" aria-hidden="true"></span>
          <h2 id="titulo-forma">Nuestra forma de trabajar</h2>

          <ul className="row g-4 list-unstyled tarjetas-valor">
            <li className="col-12 col-md-4">
              <article className="valor">
                <span className="valor-icono valor-icono-verde">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M3 12l4-4 3 3 4-4 3 3 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 18h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <h3>Trato directo</h3>
                <p>Coordinas tu pedido con la misma distribuidora. Sin intermediarios.</p>
              </article>
            </li>

            <li className="col-12 col-md-4">
              <article className="valor">
                <span className="valor-icono valor-icono-celeste">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <h3>Producto sellado</h3>
                <p>Los cilindros llegan sellados y con revisión previa a la entrega.</p>
              </article>
            </li>

            <li className="col-12 col-md-4">
              <article className="valor">
                <span className="valor-icono valor-icono-tinta">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </span>
                <h3>Cobertura local</h3>
                <p>Trabajamos principalmente en Chillán y comunas cercanas de Ñuble.</p>
              </article>
            </li>
          </ul>
        </div>
      </section>

      <section className="zonas" aria-labelledby="titulo-zonas">
        <div className="container" data-revelar>
          <div className="titulo-seccion">
            <p>Cobertura</p>
            <h2 id="titulo-zonas">Dónde llegamos</h2>
          </div>

          <form className="cobertura" id="formCobertura" noValidate>
            <label htmlFor="comuna">¿Llegamos a tu comuna?</label>
            <div className="cobertura-fila">
              <input
                type="text"
                id="comuna"
                name="comuna"
                placeholder="Escribe tu comuna"
                autoComplete="address-level2"
                list="comunasCubiertas" />
              <datalist id="comunasCubiertas">
                <option value="Chillán"></option>
                <option value="Chillán Viejo"></option>
                <option value="El Carmen"></option>
                <option value="Pinto"></option>
                <option value="San Ignacio"></option>
                <option value="Bulnes"></option>
                <option value="Quillón"></option>
              </datalist>
              <button type="submit" className="btn btn-principal">Revisar</button>
            </div>
            <div className="resultado-cobertura d-none" id="resultadoCobertura" role="status" aria-live="polite"></div>
          </form>

          <div className="tabla-scroll">
            <table className="tabla-zonas">
              <thead>
                <tr>
                  <th scope="col">Zona</th>
                  <th scope="col">Comunas cubiertas</th>
                  <th scope="col">Días de despacho</th>
                  <th scope="col">Horario</th>
                  <th scope="col">Entrega estimada</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Zona Centro</th>
                  <td>Chillán, sectores centro, norte y sur</td>
                  <td>Lunes a sábado</td>
                  <td>08:00 – 20:00</td>
                  <td>1 – 3 horas</td>
                </tr>
                <tr>
                  <th scope="row">Zona Oriente</th>
                  <td>Chillán sector oriente, Chillán Viejo</td>
                  <td>Lunes a viernes</td>
                  <td>08:00 – 18:00</td>
                  <td>2 – 4 horas</td>
                </tr>
                <tr>
                  <th scope="row">Zona Rural</th>
                  <td>El Carmen, Pinto, San Ignacio</td>
                  <td>Martes y jueves</td>
                  <td>08:00 – 16:00</td>
                  <td>3 – 6 horas</td>
                </tr>
                <tr>
                  <th scope="row">Zona Sur</th>
                  <td>Bulnes, Quillón</td>
                  <td>Miércoles</td>
                  <td>08:00 – 16:00</td>
                  <td>4 – 6 horas</td>
                </tr>
                <tr>
                  <th scope="row">Zona Comercial</th>
                  <td>Parques industriales y locales comerciales</td>
                  <td>Lunes a viernes</td>
                  <td>07:00 – 17:00</td>
                  <td>Según agenda</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>


    </main>
  )
}

export default Nosotros
