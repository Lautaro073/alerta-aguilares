import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText, Siren } from 'lucide-react';
import { OG_CARD, SITE_URL } from '@/lib/legal';

const DESCRIPCION_META =
  'Condiciones de uso de Alertas Aguilares, plataforma vecinal de reportes geolocalizados de Aguilares, Tucumán.';

export const metadata: Metadata = {
  title: 'Términos y Condiciones - Alertas Aguilares',
  description: DESCRIPCION_META,
  robots: { index: true, follow: true },
  alternates: { canonical: '/terminos' },
  // `openGraph` reemplaza al del layout raíz (no se fusiona), así que se
  // repiten siteName/locale/type para no perderlos.
  openGraph: {
    title: 'Términos y Condiciones - Alertas Aguilares',
    description: DESCRIPCION_META,
    type: 'article',
    locale: 'es_AR',
    siteName: 'Alertas Aguilares',
    url: '/terminos',
    images: [OG_CARD],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Términos y Condiciones - Alertas Aguilares',
    description: DESCRIPCION_META,
    images: [OG_CARD.url],
  },
};

const ULTIMA_ACTUALIZACION = '31 de julio de 2026';

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

export default function TerminosPage() {
  return (
    <main className="min-h-dvh bg-[#080d1a] text-foreground font-jakarta flex flex-col items-center px-4 py-8 md:py-16 selection:bg-accent/30 selection:text-white">
      <div className="w-full max-w-3xl flex flex-col gap-8 md:gap-10 animate-fade-in">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex flex-col">
            <h1 className="font-outfit font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
              <FileText className="text-accent shrink-0" size={24} />
              <span>Términos y Condiciones</span>
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

        <p className="font-jakarta text-sm text-muted leading-relaxed">
          Estas condiciones regulan el uso de Alertas Aguilares. Al crear una cuenta o
          publicar una alerta, aceptás lo que sigue. Está escrito lo más simple posible,
          pero es un acuerdo con efectos legales: si algo no te cierra, no uses el
          servicio y escribinos.
        </p>

        {/* Aviso de emergencias: lo más importante de toda la página */}
        <aside className="glass-strong border-red-500/30 p-5 flex flex-col sm:flex-row gap-4 items-start bg-red-500/[0.07]">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 shrink-0">
            <Siren size={20} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-outfit font-bold text-sm text-white tracking-wide">
              Esto no es un servicio de emergencias
            </h2>
            <p className="font-jakarta text-xs text-muted leading-relaxed">
              Alertas Aguilares es una plataforma vecinal de información. <strong className="text-foreground/90 font-semibold">No
              reemplaza al 911, a la policía, a los bomberos ni a la asistencia
              médica</strong>, y nadie está de guardia leyendo los reportes en tiempo real.
              Publicar una alerta acá no genera ningún aviso automático a las autoridades
              ni garantiza que alguien vaya a responder. Si hay riesgo para la vida, la
              salud o los bienes de una persona, llamá al <strong className="text-foreground/90 font-semibold">911</strong> primero.
            </p>
          </div>
        </aside>

        <div className="flex flex-col gap-8">

          <Section id="responsable" numero={1} titulo="Quién opera el servicio">
            <p>
              Alertas Aguilares es una iniciativa personal de <strong>Lautaro Jiménez</strong>,
              DNI 44.376.073, con domicilio en Santa Cruz s/n, Aguilares, provincia de
              Tucumán, República Argentina. Contacto:{' '}
              <a href="mailto:lautarojimenez02@gmail.com">lautarojimenez02@gmail.com</a>.
            </p>
            <p>
              Estas condiciones rigen el uso del sitio{' '}
              <a href={SITE_URL} target="_blank" rel="noreferrer">
                {SITE_URL.replace('https://', '')}
              </a>{' '}
              y de la aplicación instalable que se ofrece desde ahí.
            </p>
            <p>
              El servicio <strong>no pertenece ni representa a la Municipalidad de Aguilares,
              ni a ningún organismo público, partido político ni fuerza de seguridad</strong>.
              Es un proyecto vecinal independiente y gratuito.
            </p>
          </Section>

          <Section id="servicio" numero={2} titulo="Qué es Alertas Aguilares">
            <p>
              Es una aplicación web que permite a los vecinos publicar reportes
              geolocalizados sobre problemas urbanos de Aguilares y verlos en un mapa
              público: baches, semáforos fuera de servicio, señalización dañada, fallas de
              alumbrado, vehículos abandonados, accidentes de tránsito y las demás
              categorías que estén disponibles en cada momento.
            </p>
            <p>
              <strong>Las categorías no son una lista cerrada.</strong> Podemos agregar,
              renombrar, agrupar o eliminar categorías según las necesidades del servicio y
              lo que la comunidad vaya usando, sin previo aviso y sin que eso modifique
              estas condiciones. Si se elimina una categoría, los reportes ya publicados
              bajo ella pueden reasignarse a otra o dejar de mostrarse.
            </p>
            <p>
              El uso es gratuito. No vendemos bienes ni servicios, no hay suscripciones ni
              cobros de ningún tipo, y por eso no corresponde el botón de arrepentimiento
              previsto para las contrataciones a distancia.
            </p>
          </Section>

          <Section id="requisitos" numero={3} titulo="Quién puede usarlo">
            <p>
              Para crear una cuenta tenés que ser <strong>mayor de 18 años</strong> o estar
              emancipado. La plataforma no está dirigida a niñas, niños ni adolescentes.
            </p>
            <p>
              El motivo es concreto: los reportes son públicos, incluyen ubicación
              geográfica y muestran el nombre de quien los publica, y aceptar estas
              condiciones es celebrar un contrato. Si detectamos una cuenta de una persona
              menor de edad, podemos darla de baja y eliminar sus datos.
            </p>
            <p>
              Cualquier persona puede <strong>ver</strong> el mapa sin registrarse. La
              cuenta hace falta únicamente para publicar.
            </p>
          </Section>

          <Section id="cuenta" numero={4} titulo="Tu cuenta y tu nombre público">
            <p>
              <strong>No existen las alertas anónimas.</strong> Para publicar necesitás una
              cuenta, y cada alerta que publicás queda asociada a tu cuenta y muestra
              públicamente tu nombre visible junto al reporte, con la leyenda «Vecino
              Registrado». Cualquier persona que entre al mapa lo va a ver, esté registrada
              o no.
            </p>
            <p>
              Tenelo presente antes de publicar: si estás reportando algo que puede generarte
              un conflicto con otra persona, tu nombre va a estar ahí. Si preferís que no se
              te identifique, no publiques.
            </p>
            <p>
              Sos responsable de la veracidad de los datos de tu cuenta y de mantener tu
              contraseña en secreto. Todo lo que se publique desde tu cuenta se considera
              hecho por vos. Si sospechás que alguien accedió a tu cuenta, avisanos.
            </p>
          </Section>

          <Section id="reglas" numero={5} titulo="Qué no podés publicar">
            <p>
              Sos el único autor y responsable del contenido que subís. Está prohibido
              publicar:
            </p>
            <ul>
              <li>
                <strong>Imputaciones falsas de delitos a personas identificadas o
                identificables.</strong> Atribuirle falsamente a alguien un delito concreto
                puede constituir <strong>calumnia</strong> (art. 109 del Código Penal), y
                desacreditarlo o deshonrarlo puede constituir <strong>injuria</strong>{' '}
                (art. 110). Ambas figuras excluyen las expresiones sobre asuntos de interés
                público y las que no son asertivas, pero eso no es un permiso para acusar a
                un vecino con nombre y apellido.
              </li>
              <li>
                <strong>Imágenes de personas identificables sin su consentimiento.</strong>{' '}
                El art. 53 del Código Civil y Comercial exige el consentimiento de la persona
                para captar o reproducir su imagen, salvo que participe en actos públicos,
                exista un interés científico, cultural o educacional prioritario, o se trate
                del ejercicio regular del derecho de informar sobre un acontecimiento de
                interés general. Un bache no requiere fotografiar a nadie.
              </li>
              <li>
                <strong>Datos que invadan la intimidad ajena</strong>: domicilios
                particulares, teléfonos, patentes asociadas a una persona, rutinas,
                fotos del interior de una vivienda o cualquier dato que exponga la vida
                privada de un tercero (art. 1770 del Código Civil y Comercial).
              </li>
              <li>
                <strong>Datos sensibles de terceros</strong>: origen racial o étnico,
                opiniones políticas, convicciones religiosas, afiliación sindical,
                información de salud o vida sexual (art. 7 de la Ley 25.326).
              </li>
              <li>
                <strong>Reportes falsos a sabiendas.</strong> Además de la suspensión de tu
                cuenta, denunciar falsamente un delito ante la autoridad está penado por el
                art. 245 del Código Penal.
              </li>
              <li>
                Contenido discriminatorio, amenazas, incitación a la violencia o a hacer
                justicia por mano propia, publicidad, spam o reportes duplicados.
              </li>
            </ul>
            <p>
              Nada de esto restringe tu libertad de expresión sobre asuntos de interés
              público, que está amparada por la Ley 26.032. Lo que se prohíbe es el contenido
              ilícito, no la crítica.
            </p>
          </Section>

          <Section id="fotos" numero={6} titulo="Fotos: leé esto antes de subir una">
            <p>
              Las fotos que subís se publican <strong>tal como las enviás</strong>. Hoy el
              sistema <strong>no difumina caras, patentes ni ningún otro dato</strong> de
              forma automática, y no hay revisión previa antes de que la imagen quede
              visible en el mapa.
            </p>
            <p>
              Es decir: si en tu foto aparece una persona reconocible, la va a ver cualquiera.
              Encuadrá el problema que estás reportando y no a la gente que pasa. Si podés
              sacar la foto sin que aparezca nadie, sacala así.
            </p>
            <p>
              Al subir una imagen declarás que tenés derecho a hacerlo y que contás con el
              consentimiento necesario si aparece una persona identificable. Nos autorizás a
              alojarla y mostrarla públicamente dentro del servicio, de forma gratuita, con
              la única finalidad de operar la plataforma. Seguís siendo el titular de tus
              fotos y podés pedir que se eliminen.
            </p>
          </Section>

          <Section id="limites" numero={7} titulo="Límites de publicación, moderación y bloqueo">
            <p>
              Para evitar el spam y las alertas falsas hay un límite de{' '}
              <strong>5 reportes por día por navegador</strong> y{' '}
              <strong>10 reportes por día por conexión de red (IP)</strong>, con una ventana
              móvil de 24 horas. Estos valores pueden ajustarse.
            </p>
            <p>
              Podemos revisar, reclasificar, cambiar de estado, ocultar o eliminar cualquier
              reporte que incumpla estas condiciones, y{' '}
              <strong>suspender o bloquear de forma permanente el acceso</strong> de quien
              haga un uso abusivo del servicio. Para que el bloqueo sea efectivo utilizamos
              una huella técnica de tu navegador, que nos permite reconocer un dispositivo ya
              bloqueado aunque se cree una cuenta nueva. Cómo funciona eso está explicado en
              la{' '}
              <Link href="/privacidad#antiabuso" target="_blank" rel="noopener noreferrer">
                Política de Privacidad
              </Link>
              .
            </p>
            <p>
              Los reportes eliminados no se borran de inmediato de la base: quedan marcados
              como eliminados y dejan de mostrarse en el mapa, para poder revertir errores de
              moderación y responder pedidos de las autoridades.
            </p>
          </Section>

          <Section id="denuncias" numero={8} titulo="Cómo denunciar un contenido">
            <p>
              Si un reporte te afecta —porque es falso, porque expone tu imagen o tu
              intimidad, o porque te atribuye un hecho que no cometiste— escribinos a{' '}
              <a href="mailto:lautarojimenez02@gmail.com">lautarojimenez02@gmail.com</a>{' '}
              indicando el enlace o la ubicación del reporte, qué parte te perjudica y por
              qué. No hace falta que seas usuario registrado.
            </p>
            <p>Con ese aviso actuamos así:</p>
            <ul>
              <li>
                Si la ilicitud es <strong>manifiesta y grosera</strong> —datos personales
                expuestos, imágenes íntimas, insultos, amenazas, acusaciones evidentemente
                infundadas contra una persona identificada— damos de baja el contenido
                <strong> sin esperar ninguna orden judicial</strong>, apenas lo verificamos.
              </li>
              <li>
                Si determinar si el contenido es ilícito <strong>requiere un
                esclarecimiento</strong> que no podemos hacer nosotros —por ejemplo, si el
                reporte es verdadero o falso, o si constituye o no una injuria— el contenido
                puede permanecer publicado hasta que exista una resolución judicial o de la
                autoridad administrativa competente, que cumpliremos de inmediato.
              </li>
            </ul>
            <p>
              Este procedimiento sigue el criterio que fijó la Corte Suprema de Justicia de la
              Nación en «Rodríguez, María Belén c/ Google Inc.» (2014) para la
              responsabilidad de quienes alojan contenido de terceros.
            </p>
          </Section>

          <Section id="responsabilidad" numero={9} titulo="Hasta dónde respondemos">
            <p>
              El contenido de las alertas lo generan los usuarios. No lo revisamos antes de
              publicarlo y no verificamos que sea cierto, exacto ni actual. En consecuencia,{' '}
              <strong>no respondemos por el contenido publicado por un usuario mientras no
              tengamos conocimiento efectivo de su ilicitud</strong>. Desde que tomamos ese
              conocimiento, respondemos si no actuamos con diligencia según el procedimiento
              del punto 8.
            </p>
            <p>
              Tampoco garantizamos que el servicio esté disponible sin interrupciones ni
              errores, ni que la información del mapa esté completa o actualizada. Las
              decisiones que tomes en base a lo que leas acá son tuyas.
            </p>
            <p>
              Ahora bien, <strong>esto no es una exención total de responsabilidad</strong>:
              respondemos por los daños que causemos por dolo o culpa en la operación del
              servicio, y nada de lo escrito acá limita los derechos que la ley te reconoce
              como consumidor ni los que surgen del orden público. Si alguna cláusula de este
              documento resultara inválida, el resto sigue vigente.
            </p>
          </Section>

          <Section id="datos" numero={10} titulo="Tus datos personales">
            <p>
              El tratamiento de tus datos está explicado en detalle en la{' '}
              <Link href="/privacidad" target="_blank" rel="noopener noreferrer">
                Política de Privacidad
              </Link>
              , que forma parte de
              estas condiciones. Ahí encontrás qué datos recolectamos, para qué, con quién
              se comparten, que se alojan en servidores fuera de la Argentina y cómo ejercer
              tus derechos de acceso, rectificación y supresión.
            </p>
          </Section>

          <Section id="baja" numero={11} titulo="Cómo darte de baja">
            <p>
              Podés pedir la eliminación de tu cuenta cuando quieras escribiendo a{' '}
              <a href="mailto:lautarojimenez02@gmail.com">lautarojimenez02@gmail.com</a>{' '}
              desde el correo con el que te registraste. Damos de baja la cuenta y borramos
              tus datos personales.
            </p>
            <p>
              Los reportes que hayas publicado pueden mantenerse en el mapa
              <strong> disociados de tu identidad</strong>, es decir, sin tu nombre, porque
              la información sobre el estado de la vía pública tiene valor para la comunidad
              con independencia de quién la cargó. Si querés que se eliminen también los
              reportes, pedilo expresamente y lo hacemos.
            </p>
          </Section>

          <Section id="cambios" numero={12} titulo="Cambios en estas condiciones">
            <p>
              Podemos modificar estas condiciones para adaptarlas a cambios del servicio o de
              la normativa. La fecha de la última actualización figura arriba. Si el cambio
              es sustancial, lo vamos a avisar dentro de la aplicación. Seguir usando el
              servicio después de un cambio implica aceptarlo; si no estás de acuerdo, podés
              darte de baja.
            </p>
            <p>
              También podemos suspender o discontinuar el servicio en cualquier momento. Es
              un proyecto personal y gratuito, sin garantía de continuidad.
            </p>
          </Section>

          <Section id="jurisdiccion" numero={13} titulo="Ley aplicable y jurisdicción">
            <p>
              Estas condiciones se rigen por las leyes de la República Argentina. Ante
              cualquier conflicto, se aplican los tribunales ordinarios de la provincia de
              Tucumán.
            </p>
            <p>
              Si sos considerado consumidor, esto no te impide reclamar ante el organismo de
              defensa del consumidor que corresponda a tu domicilio, ni ante la Agencia de
              Acceso a la Información Pública en materia de datos personales.
            </p>
          </Section>

        </div>

        <footer className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="font-jakarta text-[11px] text-muted">
            ¿Dudas sobre estos términos? Escribinos a{' '}
            <a
              href="mailto:lautarojimenez02@gmail.com"
              className="text-accent font-semibold underline underline-offset-2"
            >
              lautarojimenez02@gmail.com
            </a>
          </p>
          <Link
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-xs py-2 px-4 rounded-lg shrink-0"
          >
            Ver Política de Privacidad
          </Link>
        </footer>

      </div>
    </main>
  );
}
