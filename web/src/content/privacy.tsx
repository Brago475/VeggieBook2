import { LegalContact, type LegalDocument } from '../components/layout/LegalPage'
import type { Strings } from '../i18n/useStrings'

// Privacy Policy. Changing the text requires a new version and updated date.
const PRIVACY_VERSION = '1.2'

const en: LegalDocument = {
  title: 'Privacy Policy',
  version: PRIVACY_VERSION,
  updated: 'October 16, 2026',
  intro: (
    <p>
      This policy explains what information VeggieBook2 collects and how it is
      used.{' '}
      <strong>By creating an account, you agree to this Privacy Policy</strong>{' '}
      and to our Terms of Use.
    </p>
  ),
  sections: [
    {
      id: 'information-we-collect',
      heading: 'Information We Collect',
      body: (
        <>
          <p>When you create an account, we collect only what the account requires:</p>
          <ul className="legal-list">
            <li>First and last name</li>
            <li>Username</li>
            <li>Email address</li>
            <li>Age range (not your date of birth)</li>
            <li>Your recovery PIN and security question and answer</li>
            <li>The books you create</li>
          </ul>
          <p>
            If research tracking is on, we also record the choices described in
            Research Tracking below.
          </p>
          <p>
            Your password, recovery PIN, and security answer are never stored in
            readable form. We keep only a secure one-way hash of each, which
            cannot be converted back into what you typed.
          </p>
        </>
      ),
    },
    {
      id: 'information-you-share',
      heading: 'Information You Choose to Share',
      body: (
        <p>
          Please do not include sensitive information, such as health details,
          identification numbers, or your home address, in your username, your
          security answer, or your cover photos.
        </p>
      ),
    },
    {
      id: 'privacy-of-your-books',
      heading: 'Privacy of Your Books',
      body: (
        <p>
          Your books and cover photos remain in your account. Other users cannot
          view them.
        </p>
      ),
    },
    {
      id: 'guest-visits',
      heading: 'Guest Visits',
      body: (
        <p>
          Guest visits require no name or email address and are never tracked
          for research. All guest data is deleted when the visit ends, or after
          24 hours.
        </p>
      ),
    },
    {
      id: 'how-we-use-it',
      heading: 'How We Use Your Information',
      body: (
        <p>
          We use your information to operate your account: to sign you in, store
          your books, and help you recover your account. If research tracking is
          on, your choices are also used for research at Kean University, as
          described below. VeggieBook2 does not send email at this time. We do
          not sell your information, display advertising, or send marketing
          messages.
        </p>
      ),
    },
    {
      id: 'research-tracking',
      heading: 'Research Tracking',
      body: (
        <>
          <p>
            Research tracking is <strong>on by default</strong> for every
            signed-in account. Guests are never tracked. Choices are recorded only
            while a research study is running.
          </p>
          <p>
            <strong>What is recorded:</strong>
          </p>
          <ul className="legal-list">
            <li>Your answers to the profile questions</li>
            <li>The vegetables you choose</li>
            <li>The recipes and secrets you keep or remove</li>
            <li>The books you save, and the language you used (English or Spanish)</li>
            <li>Your age range</li>
            <li>The date and time of each choice, and how long you spend on each question</li>
          </ul>
          <p>
            <strong>Never recorded for research:</strong> your name, username,
            email address, password, recovery PIN, security answer, or cover
            photos.
          </p>
          <ul className="legal-list">
            <li>
              Research data is recorded under your <strong>research ID</strong>,
              which is separate from your account and does not contain your name
              or email address.
            </li>
            <li>Your research ID is shown in Profile and settings while research tracking is on.</li>
            <li>
              You may turn research tracking off at any time in Profile and
              settings. While it is off, nothing is recorded, and books you save
              are not used in research.
            </li>
            <li>
              If a study starts while your tracking is off, you will see a notice
              and can choose to join or stay out.
            </li>
            <li>
              The research team may ask you for your research ID. If you provide
              it, the research team will be able to identify which research data
              is yours.
            </li>
            <li>
              Your account and your research ID are kept separately. Only the
              project's main administrator can link them, and each time this
              happens it is logged.
            </li>
            <li>The research team may turn research tracking off for any account.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'cookies',
      heading: 'Cookies',
      body: (
        <p>
          VeggieBook2 uses a single cookie to keep you signed in. It does not use
          advertising or third-party tracking cookies.
        </p>
      ),
    },
    {
      id: 'account-deletion',
      heading: 'Account Deletion',
      body: (
        <p>
          You may delete your account at any time from Profile and settings. Your
          account and books are deleted immediately and{' '}
          <strong>cannot be recovered.</strong> Research data already recorded
          under your research ID may be kept for research purposes.
        </p>
      ),
    },
    {
      id: 'contact',
      heading: 'Contact',
      body: <LegalContact />,
    },
    {
      id: 'changes',
      heading: 'Changes to This Policy',
      body: (
        <p>
          If this policy is updated, the version number will change, and you will
          be asked to review and accept the new version.
        </p>
      ),
    },
  ],
}

const es: LegalDocument = {
  title: 'Política de Privacidad',
  version: PRIVACY_VERSION,
  updated: '16 de octubre de 2026',
  intro: (
    <>
      <p>
        Esta política explica qué información recopila VeggieBook2 y cómo se
        usa.{' '}
        <strong>Al crear una cuenta, aceptas esta Política de Privacidad</strong>{' '}
        y nuestros Términos de Uso.
      </p>
      <p>
        Esta es una traducción del original en inglés. Si hay alguna diferencia,
        la versión en inglés es la que vale.
      </p>
    </>
  ),
  sections: [
    {
      id: 'information-we-collect',
      heading: 'Información que Recopilamos',
      body: (
        <>
          <p>Cuando creas una cuenta, recopilamos solo lo que la cuenta necesita:</p>
          <ul className="legal-list">
            <li>Nombre y apellido</li>
            <li>Nombre de usuario</li>
            <li>Correo electrónico</li>
            <li>Rango de edad (no tu fecha de nacimiento)</li>
            <li>Tu PIN de recuperación y tu pregunta y respuesta de seguridad</li>
            <li>Los libros que creas</li>
          </ul>
          <p>
            Si el seguimiento para la investigación está activado, también
            registramos las elecciones descritas más abajo en Seguimiento para la
            Investigación.
          </p>
          <p>
            Tu contraseña, tu PIN de recuperación y tu respuesta de seguridad nunca
            se guardan de forma legible. Solo guardamos un código seguro de una
            sola vía (hash) de cada uno, que no se puede convertir de nuevo en lo
            que escribiste.
          </p>
        </>
      ),
    },
    {
      id: 'information-you-share',
      heading: 'Información que Eliges Compartir',
      body: (
        <p>
          Por favor, no incluyas información sensible, como datos de salud,
          números de identificación o tu dirección, en tu nombre de usuario, tu
          respuesta de seguridad o tus fotos de portada.
        </p>
      ),
    },
    {
      id: 'privacy-of-your-books',
      heading: 'Privacidad de Tus Libros',
      body: (
        <p>
          Tus libros y fotos de portada se quedan en tu cuenta. Otros usuarios no
          pueden verlos.
        </p>
      ),
    },
    {
      id: 'guest-visits',
      heading: 'Visitas como Invitado',
      body: (
        <p>
          Las visitas como invitado no piden nombre ni correo electrónico y nunca
          se registran para la investigación. Todos los datos de invitado se
          eliminan cuando termina la visita, o después de 24 horas.
        </p>
      ),
    },
    {
      id: 'how-we-use-it',
      heading: 'Cómo Usamos Tu Información',
      body: (
        <p>
          Usamos tu información para que tu cuenta funcione: para iniciar tu
          sesión, guardar tus libros y ayudarte a recuperar tu cuenta. Si el
          seguimiento para la investigación está activado, tus elecciones también
          se usan para investigación en Kean University, como se describe más
          abajo. VeggieBook2 no envía correos electrónicos por ahora. No vendemos
          tu información, no mostramos publicidad y no enviamos mensajes de
          mercadeo.
        </p>
      ),
    },
    {
      id: 'research-tracking',
      heading: 'Seguimiento para la Investigación',
      body: (
        <>
          <p>
            El seguimiento para la investigación está{' '}
            <strong>activado de forma predeterminada</strong> en todas las cuentas
            registradas. Los invitados nunca se registran. Las elecciones se
            registran solo mientras hay un estudio de investigación en curso.
          </p>
          <p>
            <strong>Qué se registra:</strong>
          </p>
          <ul className="legal-list">
            <li>Tus respuestas a las preguntas del perfil</li>
            <li>Las verduras que eliges</li>
            <li>Las recetas y los secretos que conservas o quitas</li>
            <li>Los libros que guardas, y el idioma que usaste (inglés o español)</li>
            <li>Tu rango de edad</li>
            <li>La fecha y la hora de cada elección, y cuánto tiempo pasas en cada pregunta</li>
          </ul>
          <p>
            <strong>Nunca se registra para la investigación:</strong> tu nombre,
            nombre de usuario, correo electrónico, contraseña, PIN de recuperación,
            respuesta de seguridad ni fotos de portada.
          </p>
          <ul className="legal-list">
            <li>
              Los datos de investigación se registran con tu{' '}
              <strong>código de investigación</strong>, que es independiente de tu
              cuenta y no contiene tu nombre ni tu correo electrónico.
            </li>
            <li>
              Tu código de investigación aparece en Perfil y configuración
              mientras el seguimiento esté activado.
            </li>
            <li>
              Puedes desactivar el seguimiento en cualquier momento en Perfil y
              configuración. Mientras esté desactivado, no se registra nada, y los
              libros que guardes no se usan en la investigación.
            </li>
            <li>
              Si empieza un estudio mientras tu seguimiento está desactivado, verás
              un aviso y podrás elegir participar o no.
            </li>
            <li>
              El equipo de investigación puede pedirte tu código de investigación.
              Si lo das, el equipo podrá identificar cuáles datos de investigación
              son tuyos.
            </li>
            <li>
              Tu cuenta y tu código de investigación se guardan por separado. Solo
              el administrador principal del proyecto puede vincularlos, y cada vez
              que esto ocurre queda registrado.
            </li>
            <li>El equipo de investigación puede desactivar el seguimiento de cualquier cuenta.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'cookies',
      heading: 'Cookies',
      body: (
        <p>
          VeggieBook2 usa una sola cookie para mantener tu sesión iniciada. No usa
          cookies de publicidad ni de seguimiento de terceros.
        </p>
      ),
    },
    {
      id: 'account-deletion',
      heading: 'Eliminación de la Cuenta',
      body: (
        <p>
          Puedes eliminar tu cuenta en cualquier momento desde Perfil y
          configuración. Tu cuenta y tus libros se eliminan de inmediato y{' '}
          <strong>no se pueden recuperar.</strong> Los datos de investigación ya
          registrados con tu código de investigación pueden conservarse para
          fines de investigación.
        </p>
      ),
    },
    {
      id: 'contact',
      heading: 'Contacto',
      body: <LegalContact />,
    },
    {
      id: 'changes',
      heading: 'Cambios en Esta Política',
      body: (
        <p>
          Si esta política se actualiza, el número de versión cambiará y se te
          pedirá que revises y aceptes la nueva versión.
        </p>
      ),
    },
  ],
}

export const PRIVACY: Strings<LegalDocument> = { en, es }