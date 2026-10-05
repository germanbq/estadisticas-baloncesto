import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";


const CONFIG = {
  appName: "Stats",
  controllerName: "Germán Bravo Quintián",
  contactEmail: "gerbq2004@gmail.com",
  supabaseRegion: "Frankfurt, Alemania (eu-central-1)",
  logRetention:
    "[PLAZOS O CRITERIOS CONCRETOS DE LOS REGISTROS TÉCNICOS EN CLERK, VERCEL Y SUPABASE, SEGÚN LOS PLANES CONTRATADOS]",
  backupRetention:
    "[PLAZO O CICLO DE ELIMINACIÓN DE LAS COPIAS DE SEGURIDAD QUE CONTENGAN DATOS PERSONALES; SI NO EXISTEN, INDICARLO]",
  lastUpdated: "5 de octubre de 2026",
} as const;

const COOKIES = [
  {
    name: "__session",
    provider: "Clerk",
    purpose: "Mantener y comprobar la sesión de usuario.",
    domain: "[DOMINIO REAL DE ESTA COOKIE]",
    duration: "[DURACIÓN REAL Y CONDICIONES DE RENOVACIÓN]",
  },
  {
    name: "__client_uat",
    provider: "Clerk",
    purpose: "Comprobar la actualización del estado de autenticación.",
    domain: "[DOMINIO REAL DE ESTA COOKIE]",
    duration: "[DURACIÓN REAL DE ESTA COOKIE]",
  },
  {
    name: "__client",
    provider: "Clerk",
    purpose: "Identificar el cliente de autenticación y gestionar su acceso.",
    domain: "[DOMINIO REAL DE ESTA COOKIE; ELIMINAR ESTA FILA SI NO SE UTILIZA]",
    duration: "[DURACIÓN REAL DE ESTA COOKIE]",
  },
] as const;

export const metadata: Metadata = {
  title: `Privacidad | ${CONFIG.appName}`,
  description:
    "Información sobre los datos personales, el inicio de sesión, los proveedores, las cookies y los derechos de los usuarios.",
};

const SECTIONS = [
  ["responsable", "1. Responsable y contacto"],
  ["datos", "2. Datos y procedencia"],
  ["finalidades", "3. Finalidades y bases legales"],
  ["proveedores", "4. Proveedores y destinatarios"],
  ["transferencias", "5. Transferencias internacionales"],
  ["conservacion", "6. Conservación y eliminación"],
  ["cookies", "7. Cookies"],
  ["derechos", "8. Tus derechos"],
  ["decisiones", "9. Decisiones automatizadas"],
  ["cambios", "10. Cambios y enlaces externos"],
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="scroll-mt-28 border-t border-[#2a2d33] pt-7"
    >
      <h2
        id={`${id}-titulo`}
        className="mb-4 text-xl font-semibold text-white"
      >
        {title}
      </h2>
      <div className="space-y-4 text-sm leading-7 text-gray-300 sm:text-base">
        {children}
      </div>
    </section>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="break-words text-orange-400 underline underline-offset-4 hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400"
    >
      {children}
    </a>
  );
}

function ContactEmail() {
  if (CONFIG.contactEmail.startsWith("[")) {
    return <span>{CONFIG.contactEmail}</span>;
  }

  return (
    <a
      href={`mailto:${CONFIG.contactEmail}`}
      className="break-words text-orange-400 underline underline-offset-4 hover:text-orange-300"
    >
      {CONFIG.contactEmail}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <main lang="es" className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <article aria-labelledby="titulo-privacidad">
        <header className="mb-8">
          <Link
            href="/"
            className="text-sm text-orange-400 underline underline-offset-4 hover:text-orange-300"
          >
            Volver a los partidos
          </Link>
          <h1
            id="titulo-privacidad"
            className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Política de privacidad
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            Última actualización: {CONFIG.lastUpdated}.
          </p>
          <p className="mt-5 leading-7 text-gray-300">
            Esta política explica cómo {CONFIG.appName} utiliza
            los datos personales de quienes visitan la web, crean una cuenta o
            contactan con el responsable. La aplicación permite consultar
            resultados y estadísticas de baloncesto. Puedes acceder a sus
            contenidos públicos sin crear una cuenta.
          </p>
        </header>

        <nav
          aria-label="Índice de la política de privacidad"
          className="mb-10 rounded-xl border border-[#2a2d33] bg-[#252a33] p-5"
        >
          <p className="mb-3 font-semibold text-white">Contenido</p>
          <ol className="grid gap-3 text-sm sm:grid-cols-2">
            {SECTIONS.map(([id, title]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-gray-300 underline underline-offset-4 hover:text-orange-400"
                >
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-8">
          <Section id="responsable" title="1. Responsable y contacto">
            <p>
              El responsable del tratamiento es {CONFIG.controllerName},
              titular del proyecto {CONFIG.appName}.
            </p>
            <p>
              Para consultas sobre tus datos personales o para ejercer tus
              derechos, puedes escribir a <ContactEmail />.
            </p>
          </Section>

          <Section id="datos" title="2. Qué datos se utilizan y de dónde proceden">
            <ul className="list-disc space-y-3 pl-6">
              <li>
                <strong className="text-white">Cuenta y autenticación:</strong>{" "}
                identificador de usuario, correo electrónico y, si se facilitan
                mediante el método de registro elegido, nombre, nombre de usuario
                e imagen de perfil. Clerk gestiona también las sesiones, los
                datos de verificación y los eventos de acceso necesarios para la
                autenticación.
              </li>
              <li>
                <strong className="text-white">Favoritos:</strong> se guardan
                los identificadores de los jugadores, equipos y partidos que
                marcas como favoritos,
                asociados al identificador de tu cuenta. Estas selecciones
                proceden de las acciones que realizas en la aplicación.
              </li>
              <li>
                <strong className="text-white">Datos técnicos:</strong> dirección
                IP, información del navegador y del dispositivo, fecha y hora de
                las solicitudes, identificadores de sesión y registros de errores
                o de seguridad tratados para entregar y proteger el servicio.
              </li>
              <li>
                <strong className="text-white">Comunicaciones:</strong> tu
                dirección de correo y el contenido de los mensajes que envíes al
                responsable.
              </li>
            </ul>
            <p>
              Los datos proceden de lo que facilitas, del uso de la web y de los
              proveedores de autenticación. Si eliges un acceso externo, como
              Google o GitHub cuando esté disponible, recibimos a través de Clerk
              los datos de identidad y perfil autorizados para ese acceso. La
              aplicación no recibe la contraseña de tu cuenta de Google o GitHub.
            </p>
            <p>
              Los datos que el registro señala como obligatorios son necesarios
              para crear o verificar tu cuenta; si no los facilitas, no podrás
              completar ese registro. Los campos indicados como opcionales no son
              necesarios para consultar los contenidos públicos.
            </p>
            <p>
              Las cuentas se gestionan en Clerk. PostgreSQL contiene la
              información deportiva y almacena también tus favoritos vinculados al
              identificador de tu cuenta. No se guarda en esa base de datos una
              copia completa de tu perfil de autenticación ni tus contraseñas.
            </p>
          </Section>

          <Section id="finalidades" title="3. Para qué se utilizan y con qué base legal">
            <ul className="list-disc space-y-3 pl-6">
              <li>
                <strong className="text-white">Gestionar la cuenta y el acceso:</strong>{" "}
                registrar usuarios, verificar su identidad y mantener sus
                sesiones. La base es la ejecución del servicio de cuenta
                solicitado por el usuario, conforme al artículo 6.1.b del RGPD.
              </li>
              <li>
                <strong className="text-white">Guardar y mostrar tus favoritos:</strong>{" "}
                conservamos las selecciones de jugadores, equipos y partidos que
                marcas como favoritos para que puedas consultarlas al acceder
                con tu cuenta. La base es la
                prestación de esa función solicitada por ti, conforme al
                artículo 6.1.b del RGPD. Marcar favoritos es opcional y no es
                necesario para consultar los contenidos públicos.
              </li>
              <li>
                <strong className="text-white">Funcionamiento y seguridad:</strong>{" "}
                entregar las páginas, detectar fallos, prevenir abusos y proteger
                las cuentas. La base es el interés legítimo de mantener el
                servicio operativo y seguro, conforme al artículo 6.1.f del
                RGPD, teniendo en cuenta los derechos de los usuarios.
              </li>
              <li>
                <strong className="text-white">Atender consultas:</strong>{" "}
                responder a los mensajes enviados al responsable. La base es el
                interés legítimo de atender esas comunicaciones, conforme al
                artículo 6.1.f del RGPD.
              </li>
              <li>
                <strong className="text-white">Atender solicitudes de derechos:</strong>{" "}
                cumplir las obligaciones de protección de datos. La base es el
                cumplimiento de una obligación legal, conforme al artículo 6.1.c
                del RGPD.
              </li>
            </ul>
            <p>
              Esta versión no incorpora publicidad, envío de comunicaciones
              comerciales ni herramientas de analítica de audiencia.
            </p>
          </Section>

          <Section id="proveedores" title="4. Proveedores y otros destinatarios">
            <p>
              Para ofrecer el servicio se utilizan los siguientes proveedores,
              que pueden tratar datos necesarios para sus funciones:
            </p>
            <ul className="list-disc space-y-3 pl-6">
              <li>
                <strong className="text-white">Clerk, Inc.:</strong> registro,
                inicio de sesión y gestión de cuentas. Consulta su{" "}
                <ExternalLink href="https://clerk.com/legal/privacy">
                  política de privacidad
                </ExternalLink>{" "}
                y su{" "}
                <ExternalLink href="https://clerk.com/legal/dpa">
                  acuerdo de tratamiento de datos
                </ExternalLink>.
              </li>
              <li>
                <strong className="text-white">Vercel, Inc.:</strong> alojamiento
                y entrega de la web, con tratamiento de solicitudes y datos
                técnicos de funcionamiento y seguridad. Consulta su{" "}
                <ExternalLink href="https://vercel.com/legal/privacy-notice">
                  información de privacidad
                </ExternalLink>.
              </li>
              <li>
                <strong className="text-white">Supabase Pte. Ltd.:</strong>{" "}
                alojamiento de PostgreSQL y sus servicios técnicos, incluido el
                almacenamiento de los favoritos asociados a tu cuenta.
                Región del proyecto:{" "}
                {CONFIG.supabaseRegion}. Consulta su{" "}
                <ExternalLink href="https://supabase.com/privacy">
                  política de privacidad
                </ExternalLink>{" "}
                y su{" "}
                <ExternalLink href="https://supabase.com/legal/customer-resources/data-processing-addendum">
                  acuerdo de tratamiento de datos
                </ExternalLink>.
              </li>
            </ul>
            <p>
              Estos proveedores pueden recurrir a subproveedores para prestar
              sus servicios. Sus documentos identifican sus funciones y las
              garantías aplicables. En los tratamientos realizados por cuenta
              del proyecto actúan como encargados; también pueden ser
              responsables de determinados tratamientos propios descritos en sus
              políticas.
            </p>
            <p>
              Si utilizas un proveedor externo de inicio de sesión, ese proveedor
              trata los datos correspondientes al acceso según sus propias
              condiciones. También podrán comunicarse datos a autoridades cuando
              exista una obligación legal. El proyecto no vende datos personales.
            </p>
          </Section>

          <Section id="transferencias" title="5. Transferencias internacionales">
            <p>
              El uso de estos servicios puede implicar tratamiento de datos fuera
              del Espacio Económico Europeo, incluido Estados Unidos en el caso
              de Clerk y Vercel y Singapur u otros países en la infraestructura de
              Supabase y sus subproveedores. Elegir una región europea para la
              base de datos no significa que todos los tratamientos de todos los
              proveedores se realicen exclusivamente en Europa.
            </p>
            <p>
              Clerk y Vercel declaran su adhesión al Marco de Privacidad de Datos
              UE-EE. UU. para las transferencias cubiertas por ese marco.
              Supabase incorpora cláusulas contractuales tipo de la Comisión
              Europea cuando resultan aplicables; Clerk también contempla esas
              cláusulas como mecanismo alternativo en su acuerdo.
            </p>
            <p>
              Puedes consultar las garantías y los subproveedores en los
              documentos enlazados en el apartado anterior, o pedir información
              y una copia de las garantías aplicables escribiendo al correo de
              contacto.
            </p>
          </Section>

          <Section id="conservacion" title="6. Conservación y eliminación">
            <ul className="list-disc space-y-3 pl-6">
              <li>
                <strong className="text-white">Datos de la cuenta:</strong> se
                conservan mientras mantengas la cuenta y sean necesarios para
                gestionarla. Puedes solicitar su eliminación al correo de
                contacto; la solicitud se tramitará también respecto de los datos
                gestionados por Clerk por cuenta del proyecto.
              </li>
              <li>
                <strong className="text-white">Favoritos:</strong> tus
                selecciones se conservan hasta
                que quites el favorito correspondiente o elimines tu cuenta.
                También puedes solicitar su eliminación al correo de contacto.
                Al tramitar la eliminación de la cuenta se eliminan los
                favoritos asociados a su identificador en PostgreSQL, con las
                excepciones de conservación legal y de copias descritas en este
                apartado.
              </li>
              <li>
                <strong className="text-white">Registros técnicos:</strong>{" "}
                {CONFIG.logRetention}.
              </li>
              <li>
                <strong className="text-white">Comunicaciones:</strong> durante
                la atención de la consulta y hasta su cierre; después, únicamente
                si son necesarias para cumplir una obligación legal o atender
                una reclamación, durante el plazo aplicable a esa obligación o
                reclamación.
              </li>
              <li>
                <strong className="text-white">Copias de seguridad:</strong>{" "}
                {CONFIG.backupRetention}.
              </li>
            </ul>
            <p>
              Cuando una obligación legal exija conservar determinados datos,
              estos no se utilizarán para el funcionamiento ordinario de una
              cuenta eliminada. Los tratamientos que un proveedor realice como
              responsable propio se rigen por sus condiciones y no se eliminan
              necesariamente al mismo tiempo que la cuenta del proyecto.
            </p>
          </Section>

          <Section id="cookies" title="7. Cookies de autenticación">
            <p>
              Las cookies son pequeños archivos que el navegador almacena.
              Se utilizan para identificar la sesión y permitir el acceso a la
              cuenta. Esta versión no utiliza cookies de publicidad ni de
              analítica de audiencia.
            </p>
            <div className="overflow-x-auto rounded-lg border border-[#2a2d33]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="bg-[#252a33] px-4 py-3 text-left font-medium text-white">
                  Cookies utilizadas para la autenticación
                </caption>
                <thead className="bg-[#1d2026] text-white">
                  <tr>
                    <th scope="col" className="px-4 py-3">Cookie y proveedor</th>
                    <th scope="col" className="px-4 py-3">Finalidad</th>
                    <th scope="col" className="px-4 py-3">Dominio</th>
                    <th scope="col" className="px-4 py-3">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES.map((cookie) => (
                    <tr key={cookie.name} className="border-t border-[#2a2d33] align-top">
                      <th scope="row" className="px-4 py-3 font-normal">
                        <code className="text-orange-300">{cookie.name}</code>
                        <span className="mt-1 block text-gray-400">{cookie.provider}</span>
                      </th>
                      <td className="px-4 py-3">{cookie.purpose}</td>
                      <td className="px-4 py-3">{cookie.domain}</td>
                      <td className="px-4 py-3">{cookie.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Puedes eliminar o bloquear cookies desde los ajustes de tu
              navegador. Bloquear las necesarias para la autenticación puede
              impedir que inicies sesión o que se mantenga tu cuenta conectada.
              Puedes consultar más información en la{" "}
              <ExternalLink href="https://clerk.com/docs/guides/how-clerk-works/cookies">
                documentación de cookies de Clerk
              </ExternalLink>.
            </p>
            <p>
              Las cookies estrictamente necesarias para prestar el servicio
              solicitado están exceptuadas de consentimiento previo. Si se
              incorporan cookies u otras tecnologías que lo requieran, se
              ofrecerá previamente la posibilidad de aceptarlas o rechazarlas y
              de cambiar esa elección.
            </p>
          </Section>

          <Section id="derechos" title="8. Tus derechos y cómo ejercerlos">
            <p>
              Puedes solicitar acceso, rectificación, supresión, limitación del
              tratamiento, oposición y portabilidad de tus datos, cuando se
              cumplan los requisitos de cada derecho. Si algún tratamiento se
              basa en tu consentimiento, puedes retirarlo sin afectar a la
              licitud del tratamiento anterior.
            </p>
            <p>
              Para ejercerlos, escribe a <ContactEmail /> indicando tu
              solicitud y la cuenta a la que se refiere. Solo se pedirá
              información adicional para verificar tu identidad cuando sea
              necesaria. El ejercicio es gratuito, salvo las excepciones legales
              para solicitudes manifiestamente infundadas o excesivas.
            </p>
            <p>
              Se responderá en el plazo de un mes desde la recepción. Si la
              complejidad o el número de solicitudes lo justifican, el plazo puede
              ampliarse hasta dos meses adicionales; se te informará de la
              ampliación y de sus motivos dentro del primer mes.
            </p>
            <p>
              También puedes reclamar ante la{" "}
              <ExternalLink href="https://www.aepd.es/">
                Agencia Española de Protección de Datos
              </ExternalLink>{" "}
              o ante la autoridad de protección de datos competente,
              especialmente si consideras que no se han atendido tus derechos.
            </p>
          </Section>

          <Section id="decisiones" title="9. Decisiones automatizadas">
            <p>
              El proyecto no utiliza tus datos para tomar decisiones basadas
              exclusivamente en tratamientos automatizados que produzcan efectos
              jurídicos o te afecten de forma similar significativamente. Tampoco
              elabora perfiles con fines publicitarios.
            </p>
          </Section>

          <Section id="cambios" title="10. Cambios y enlaces externos">
            <p>
              Esta política se actualizará si cambian los datos tratados, las
              funciones o los proveedores. La fecha de actualización aparece al
              principio de la página. Los nuevos tratamientos se comunicarán
              antes de aplicarlos y se solicitará consentimiento cuando resulte
              necesario.
            </p>
            <p>
              La web contiene enlaces externos, como GitHub y las fuentes de las
              fotografías. Si los abres, visitarás servicios que aplican sus
              propias políticas de privacidad.
            </p>
          </Section>
        </div>

        <p className="mt-10 border-t border-[#2a2d33] pt-6 text-sm leading-6 text-gray-400">
          Para cualquier consulta relacionada con esta política: <ContactEmail />.
        </p>
      </article>
    </main>
  );
}
