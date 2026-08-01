import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, EyeOff } from 'lucide-react';
import { CONTACTO_LEGAL, OG_CARD, SITE_URL } from '@/lib/legal';

const DESCRIPCION_META =
  'Qué datos personales trata Alertas Aguilares, con qué finalidad, con quién se comparten y cómo ejercer tus derechos conforme a la Ley 25.326.';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Alertas Aguilares',
  description: DESCRIPCION_META,
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacidad' },
  // `openGraph` reemplaza al del layout raíz (no se fusiona), así que se
  // repiten siteName/locale/type para no perderlos.
  openGraph: {
    title: 'Política de Privacidad - Alertas Aguilares',
    description: DESCRIPCION_META,
    type: 'article',
    locale: 'es_AR',
    siteName: 'Alertas Aguilares',
    url: '/privacidad',
    images: [OG_CARD],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Privacidad - Alertas Aguilares',
    description: DESCRIPCION_META,
    images: [OG_CARD.url],
  },
};

const ULTIMA_ACTUALIZACION = '31 de julio de 2026';
const CONTACTO = CONTACTO_LEGAL;

function Section({
  id,
  numero,
  titulo,
  children,
}: {
  id: string;
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 flex flex-col gap-3">
      <h2 className="font-outfit font-bold text-base text-white tracking-wide flex gap-2.5">
        <span className="text-accent tabular-nums shrink-0">{numero}.</span>
        <span>{titulo}</span>
      </h2>
      <div className="flex flex-col gap-3 font-jakarta text-xs text-muted leading-relaxed pl-[1.6rem] [&_strong]:text-foreground/90 [&_strong]:font-semibold [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_a]:text-accent [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

/** Leyenda de reproducción obligatoria: no editar el texto. */
function Leyenda({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-accent/50 bg-surface-1/40 rounded-r-lg px-4 py-3 font-jakarta text-xs text-foreground/80 leading-relaxed italic">
      {children}
    </blockquote>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#080d1a] text-foreground font-jakarta flex flex-col items-center px-4 py-8 md:py-16 selection:bg-accent/30 selection:text-white">
      <div className="w-full max-w-3xl flex flex-col gap-8 md:gap-10 animate-fade-in">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex flex-col">
            <h1 className="font-outfit font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="text-accent shrink-0" size={24} />
              <span>Política de Privacidad</span>
            </h1>
            <span className="font-jakarta text-[10px] text-muted font-bold tracking-wider uppercase mt-1">
              Alertas Aguilares · Última actualización: {ULTIMA_ACTUALIZACION}
            </span>
          </div>

          <Link
            href="/"
            className="btn btn-ghost inline-flex items-center gap-2 self-start sm:self-auto text-xs py-2 px-4 rounded-lg"
          >
            <ArrowLeft size={14} />
            <span>Volver al mapa</span>
          </Link>
        </header>

        {/* Resumen honesto arriba de todo: es lo que más gente va a leer */}
        <aside className="glass-strong p-5 md:p-6 flex flex-col sm:flex-row gap-4 items-start">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shrink-0">
            <EyeOff size={20} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-outfit font-bold text-sm text-white tracking-wide">
              En pocas palabras
            </h2>
            <p className="font-jakarta text-xs text-muted leading-relaxed">
              <strong className="text-foreground/90 font-semibold">Las alertas no son
              anónimas.</strong> Para publicar necesitás una cuenta, y tu nombre visible
              aparece públicamente en cada alerta que publicás, junto con la ubicación
              exacta y las fotos que subas. Cualquier persona puede verlo, sin registrarse.
            </p>
            <p className="font-jakarta text-xs text-muted leading-relaxed">
              No vendemos tus datos, no hacemos publicidad y no usamos analítica de terceros.
              Sí guardamos información técnica para frenar el abuso, incluida una huella de
              tu navegador que nos permite bloquear a quien haga mal uso. Está explicado sin
              vueltas en el punto 5.
            </p>
          </div>
        </aside>

        <div className="flex flex-col gap-8">

          <Section id="responsable" numero={1} titulo="Quién es responsable de tus datos">
            <p>
              El responsable del tratamiento es <strong>Lautaro Jiménez</strong>, DNI
              44.376.073, con domicilio en Santa Cruz s/n, Aguilares, provincia de Tucumán,
              República Argentina. Correo de contacto para cualquier tema de privacidad:{' '}
              <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.
            </p>
            <p>
              Esta política se aplica al sitio{' '}
              <a href={SITE_URL} target="_blank" rel="noreferrer">
                {SITE_URL.replace('https://', '')}
              </a>{' '}
              y a la aplicación instalable que se ofrece desde ahí.
            </p>
            <p>
              Alertas Aguilares es un proyecto personal e independiente. No pertenece a la
              Municipalidad de Aguilares ni a ningún organismo público.
            </p>
            <p>
              Esta política se rige por la <strong>Ley 25.326 de Protección de los Datos
              Personales</strong> y su Decreto reglamentario 1558/2001.
            </p>
          </Section>

          <Section id="datos" numero={2} titulo="Qué datos recolectamos">
            <p><strong>Cuando creás una cuenta:</strong></p>
            <ul>
              <li>Nombre visible (el que elegís mostrar como vecino).</li>
              <li>Correo electrónico.</li>
              <li>
                Contraseña, que se guarda cifrada y a la que no tenemos acceso. Si entrás con
                Google no se crea ninguna contraseña acá.
              </li>
              <li>
                Si iniciás sesión con Google: el nombre y la foto de perfil que esa cuenta
                comparta.
              </li>
              <li>
                La fecha en que aceptaste estos documentos y la versión del texto que
                aceptaste. Lo guardamos porque el art. 5 de la Ley 25.326 exige que el
                consentimiento pueda acreditarse.
              </li>
            </ul>

            <p><strong>Cuando publicás una alerta:</strong></p>
            <ul>
              <li>La ubicación que marcás en el mapa (latitud y longitud).</li>
              <li>
                Una etiqueta de dirección aproximada, que se obtiene consultando esas
                coordenadas al servicio de geocodificación de Google.
              </li>
              <li>Categoría, título y, si querés, una descripción.</li>
              <li>Las fotos que subas.</li>
              <li>Fecha y hora, y el vínculo con tu cuenta.</li>
            </ul>

            <p><strong>Datos técnicos que registra el servidor:</strong></p>
            <ul>
              <li>Un resumen criptográfico (hash SHA-256) de tu dirección IP.</li>
              <li>Un resumen criptográfico (hash SHA-256) de la huella de tu navegador.</li>
              <li>
                El identificador de tu navegador y sistema operativo («user agent»), que se
                guarda sin transformar.
              </li>
              <li>El origen desde el que se envió la solicitud.</li>
              <li>
                Si activás las notificaciones, un token del servicio de mensajería de Google
                asociado a tu dispositivo.
              </li>
            </ul>
            <p>
              También registramos las acciones de moderación sobre cada reporte (quién cambió
              un estado, quién lo ocultó o lo restauró) para poder auditarlas.
            </p>
          </Section>

          <Section id="publico" numero={3} titulo="Qué se publica y queda visible para cualquiera">
            <p>De cada alerta se muestra públicamente, sin necesidad de tener cuenta:</p>
            <ul>
              <li>
                <strong>Tu nombre visible</strong>, con la leyenda «Vecino Registrado».
              </li>
              <li>La ubicación exacta en el mapa y la etiqueta de dirección.</li>
              <li>La categoría, el título y la descripción.</li>
              <li>Las fotos que hayas subido, con las caras difuminadas automáticamente.</li>
              <li>La fecha y hora del reporte y su estado.</li>
            </ul>
            <p>
              <strong>Las fotos no se publican tal como las mandás.</strong> Al subirlas, y
              antes de guardarlas, se les difuminan los rostros de forma automática. Además, un
              servicio automático las revisa buscando documentos legibles, patentes, datos
              personales de terceros, desnudez o heridas graves; si detecta algo de eso, se
              difumina la imagen completa. Ese análisis se hace con un proveedor externo
              (ver el punto 7).
            </p>
            <p>
              Es un proceso automático y puede fallar: una cara de perfil, lejana o poco
              iluminada puede pasar sin detectarse.{' '}
              <strong>No lo tomes como una garantía</strong> al decidir qué fotografiar.
            </p>
            <p>
              Si tu cuenta no tiene un nombre visible cargado —algo que puede pasar al entrar
              con Google si esa cuenta no comparte un nombre— la alerta se publica con una
              denominación genérica.{' '}
              <strong>Tu correo electrónico no se publica nunca, ni siquiera en parte.</strong>
            </p>
            <p>
              Tampoco se publican tu contraseña, tu dirección IP ni los datos técnicos del
              punto 5.
            </p>
          </Section>

          <Section id="finalidades" numero={4} titulo="Para qué usamos los datos y cuáles son obligatorios">
            <p>Usamos tus datos para:</p>
            <ul>
              <li>Crear y mantener tu cuenta y permitirte iniciar sesión.</li>
              <li>Publicar las alertas en el mapa y atribuirlas a su autor.</li>
              <li>Moderar el contenido y atender denuncias sobre publicaciones.</li>
              <li>Prevenir el spam, las alertas falsas y el uso abusivo del servicio.</li>
              <li>Enviarte notificaciones, solo si las activaste.</li>
              <li>Responder tus consultas y los pedidos sobre tus datos.</li>
            </ul>
            <p>
              <strong>Datos obligatorios:</strong> el nombre visible, el correo y la contraseña
              son necesarios para tener cuenta; sin ellos no podés registrarte. La ubicación,
              la categoría y el título son necesarios para publicar una alerta. Si no los
              proporcionás, no vas a poder usar esas funciones, pero podés seguir viendo el
              mapa libremente.
            </p>
            <p>
              <strong>Datos facultativos:</strong> la descripción, las fotos, la foto de
              perfil y las notificaciones push. No darlos no tiene ninguna consecuencia más
              que no contar con esa función.
            </p>
          </Section>

          <Section id="antiabuso" numero={5} titulo="Huella de navegador, IP y bloqueos: cómo funciona de verdad">
            <p>
              Esta es la parte que conviene que entiendas bien, porque suele explicarse mal.
            </p>
            <p>
              Cuando publicás una alerta, tu navegador genera una <strong>huella
              técnica</strong>: una combinación de características de tu dispositivo y tu
              navegador que, juntas, lo distinguen de otros. Esa huella y tu dirección IP se
              transforman en el servidor mediante un hash SHA-256 con una clave secreta, y
              solo se guarda el resultado. <strong>No almacenamos tu IP ni tu huella en
              texto legible</strong>, y a partir del hash no podemos reconstruir el valor
              original.
            </p>
            <p>Los usamos para dos cosas:</p>
            <ul>
              <li>
                Aplicar los límites de publicación: 5 alertas por día por navegador y 10 por
                día por conexión de red.
              </li>
              <li>
                <strong>Bloquear el acceso</strong> de quien haga un uso abusivo de la
                plataforma, aunque se cree una cuenta nueva.
              </li>
            </ul>
            <p>
              Ahora, lo importante y lo que hay que decir con todas las letras:{' '}
              <strong>que el dato esté hasheado no lo vuelve anónimo</strong>. Justamente
              porque podemos comparar el hash para reconocer un dispositivo ya bloqueado,
              seguimos pudiendo distinguirte del resto de los usuarios. Técnicamente eso es un
              dato <strong>seudonimizado</strong>, no anónimo, y por lo tanto sigue siendo un
              dato personal protegido por la Ley 25.326, con todos los derechos que eso te da
              (ver el punto 11).
            </p>
            <p>
              No usamos esta información para perfilarte, para publicidad ni para seguir tu
              navegación fuera de este sitio. Solo para seguridad y control de abuso.
            </p>
          </Section>

          <Section id="cookies" numero={6} titulo="Cookies y almacenamiento en tu navegador">
            <p>
              <strong>No usamos cookies de publicidad ni de analítica de terceros.</strong> No
              hay Google Analytics, ni píxel de Meta, ni herramientas de seguimiento
              comercial de ningún tipo.
            </p>
            <p><strong>Estrictamente necesario</strong> (no se puede desactivar):</p>
            <ul>
              <li>
                Cookies y almacenamiento local del sistema de autenticación, que mantienen tu
                sesión iniciada y la renuevan. Sin esto tendrías que iniciar sesión en cada
                acción.
              </li>
              <li>
                El identificador de huella de navegador descripto en el punto 5, que se guarda
                en el almacenamiento de sesión y se borra al cerrar la pestaña. Es lo que
                sostiene los límites antiabuso y los bloqueos: si pudiera desactivarse,
                bastaría con rechazarlo para evadirlos.
              </li>
              <li>
                Una marca temporal que recuerda si dejaste una alerta a medio cargar antes de
                iniciar sesión, para no perder lo que escribiste.
              </li>
            </ul>
            <p>
              <strong>Opcional.</strong> Son dos funciones independientes y las aceptás por
              separado en el banner: podés habilitar una y rechazar la otra. Las dos aparecen
              desmarcadas, así que rechazarlas no cuesta más trabajo que aceptarlas.
            </p>
            <ul>
              <li>
                <strong>Notificaciones push.</strong> Guardan un identificador de tu dispositivo
                en nuestro servidor para poder avisarte. Además de aceptarlas acá, tenés que
                darle permiso a tu navegador por separado. También quedan habilitadas si tocás
                el botón de la campana, porque pedir la función es aceptarla; eso no habilita la
                otra opción. Mientras no las actives,{' '}
                <strong>no se guarda ningún identificador de tu dispositivo</strong>.
              </li>
              <li>
                <strong>Preferencias de interfaz.</strong> Recordar entre visitas que ya viste
                el recorrido guiado, para no volver a mostrártelo. Si no lo aceptás, el
                recorrido sigue funcionando igual: simplemente no queda registrado que ya lo
                viste.
              </li>
            </ul>
            <p>
              Podés cambiar tu decisión borrando los datos del sitio desde la configuración de
              tu navegador; el banner vuelve a aparecer.
            </p>
          </Section>

          <Section id="terceros" numero={7} titulo="Con quién se comparten">
            <p>
              No vendemos ni cedemos tus datos con fines comerciales. Para poder funcionar, la
              aplicación se apoya en estos proveedores, que tratan datos por cuenta nuestra:
            </p>
            <ul>
              <li><strong>Supabase</strong> — base de datos y sistema de cuentas.</li>
              <li>
                <strong>Google / Firebase</strong> — verificación de que las solicitudes vienen
                de la app legítima, notificaciones push, mapas base e identificación de la
                dirección aproximada a partir de las coordenadas.
              </li>
              <li><strong>Cloudinary</strong> — alojamiento de las fotos y difuminado de rostros.</li>
              <li>
                <strong>NVIDIA</strong> — revisión automática de las fotos para detectar
                contenido sensible antes de publicarlas. La imagen se le envía únicamente con
                esa finalidad y no forma parte de ningún perfil tuyo.
              </li>
              <li><strong>Vercel</strong> — alojamiento de la aplicación.</li>
            </ul>
            <p>
              Además, podemos entregar información a las autoridades judiciales o
              administrativas competentes cuando exista un requerimiento legal válido, y
              compartir un reporte con el organismo municipal o la fuerza de seguridad que
              corresponda cuando su contenido lo amerite.
            </p>
            <p>
              Quienes intervenimos en el tratamiento —incluidos los moderadores del panel de
              administración— estamos obligados al deber de confidencialidad del art. 10 de la
              Ley 25.326, que subsiste incluso después de terminada la tarea.
            </p>
          </Section>

          <Section id="transferencia" numero={8} titulo="Tus datos salen del país">
            <p>
              Los proveedores del punto 7 alojan o procesan la información en servidores
              ubicados fuera de la República Argentina, principalmente en{' '}
              <strong>Estados Unidos</strong>. Esto incluye las fotos de los reportes, que se
              envían al exterior tanto para almacenarse como para la revisión automática de
              contenido sensible.
            </p>
            <p>
              Corresponde ser claro sobre esto: Estados Unidos{' '}
              <strong>no integra la lista de países con nivel de protección adecuado</strong>{' '}
              que publica la Agencia de Acceso a la Información Pública. Por eso, conforme al
              art. 12 de la Ley 25.326, esa transferencia necesita tu consentimiento expreso.
            </p>
            <p>
              <strong>Al crear tu cuenta prestás ese consentimiento</strong> para que tus datos
              se transfieran y almacenen en el exterior con la única finalidad de operar el
              servicio descripta en esta política. Si no estás de acuerdo con esta
              transferencia, no vas a poder usar la aplicación, porque no tenemos
              infraestructura alternativa dentro del país.
            </p>
          </Section>

          <Section id="conservacion" numero={9} titulo="Cuánto tiempo los guardamos">
            <p>
              Los datos de tu cuenta se conservan mientras la cuenta exista. Las alertas
              publicadas se conservan de forma indefinida, porque el historial del estado de
              la vía pública es el sentido mismo del proyecto.
            </p>
            <p>
              Los reportes eliminados no se borran físicamente de inmediato: quedan marcados
              como eliminados y dejan de mostrarse, para poder revertir errores de moderación
              y responder requerimientos legales.
            </p>
            <p>
              Los contadores de límite diario se reinician automáticamente al vencer la
              ventana de 24 horas. Los hashes vinculados a un bloqueo se conservan mientras el
              bloqueo esté vigente.
            </p>
          </Section>

          <Section id="seguridad" numero={10} titulo="Cómo los protegemos">
            <p>
              Adoptamos las medidas técnicas y organizativas exigidas por el art. 9 de la Ley
              25.326, tomando como referencia las medidas recomendadas por la Resolución
              AAIP 47/2018: conexión cifrada en todo el sitio, contraseñas almacenadas con
              cifrado irreversible, acceso al panel de administración restringido por roles,
              verificación de origen de las solicitudes y hasheo de los identificadores
              técnicos.
            </p>
            <p>
              Ningún sistema es infalible. Si detectamos un incidente de seguridad que afecte
              tus datos personales, te lo vamos a informar.
            </p>
          </Section>

          <Section id="derechos" numero={11} titulo="Tus derechos y cómo ejercerlos">
            <p>
              Podés pedirnos en cualquier momento <strong>acceder</strong> a tus datos,{' '}
              <strong>rectificarlos</strong> si son inexactos, <strong>actualizarlos</strong> o{' '}
              <strong>suprimirlos</strong> (arts. 14 a 16 de la Ley 25.326). También podés
              pedir la baja de tu cuenta.
            </p>
            <p>
              Escribinos a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> desde el correo con el
              que te registraste, indicando qué querés. Respondemos dentro de los plazos
              legales: 10 días corridos para los pedidos de acceso y 5 días hábiles para los
              de rectificación, actualización o supresión.
            </p>

            <Leyenda>
              El titular de los datos personales tiene la facultad de ejercer el derecho de
              acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses,
              salvo que se acredite un interés legítimo al efecto conforme lo establecido en
              el artículo 14, inciso 3 de la Ley N° 25.326.
            </Leyenda>

            <Leyenda>
              La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de
              Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y
              reclamos que se interpongan en relación al incumplimiento de las normas sobre
              protección de datos personales.
            </Leyenda>
          </Section>

          <Section id="sensibles" numero={12} titulo="Datos sensibles y datos de terceros">
            <p>
              No te pedimos datos sensibles y no queremos tenerlos. Nadie está obligado a
              proporcionarlos (art. 7 de la Ley 25.326).
            </p>
            <p>
              Como las alertas las escriben los usuarios, puede ocurrir que alguien mencione
              datos sensibles de otra persona o publique una foto donde aparezca alguien
              identificable. Eso está expresamente prohibido por los{' '}
              <Link href="/terminos#reglas" target="_blank" rel="noopener noreferrer">
                Términos y Condiciones
              </Link>
              , y podés pedir la
              baja de ese contenido escribiéndonos. El procedimiento está en el{' '}
              <Link href="/terminos#denuncias" target="_blank" rel="noopener noreferrer">
                punto 8 de los Términos
              </Link>
              .
            </p>
          </Section>

          <Section id="menores" numero={13} titulo="Menores de edad">
            <p>
              El servicio está dirigido a personas mayores de 18 años y no recolectamos datos
              de menores de forma consciente. Si tomamos conocimiento de una cuenta de una
              persona menor de edad, la damos de baja y eliminamos sus datos. Si sos madre,
              padre o tutor y creés que esto ocurrió, escribinos.
            </p>
          </Section>

          <Section id="ambito" numero={14} titulo="Ámbito territorial">
            <p>
              La aplicación está dirigida a residentes de Aguilares, provincia de Tucumán,
              República Argentina, y se rige por la legislación argentina. No está orientada a
              usuarios de la Unión Europea ni realizamos seguimiento de personas ubicadas allí.
            </p>
          </Section>

          <Section id="cambios" numero={15} titulo="Cambios en esta política">
            <p>
              Si cambian las funciones de la aplicación o la normativa aplicable, vamos a
              actualizar esta política y a modificar la fecha que figura arriba. Cuando el
              cambio afecte de forma sustancial el tratamiento de tus datos, lo avisaremos
              dentro de la aplicación.
            </p>
          </Section>

        </div>

        <footer className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="font-jakarta text-[11px] text-muted">
            ¿Consultas sobre tus datos? Escribinos a{' '}
            <a
              href={`mailto:${CONTACTO}`}
              className="text-accent font-semibold underline underline-offset-2"
            >
              {CONTACTO}
            </a>
          </p>
          <Link
            href="/terminos"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-xs py-2 px-4 rounded-lg shrink-0"
          >
            Ver Términos y Condiciones
          </Link>
        </footer>

      </div>
    </main>
  );
}
