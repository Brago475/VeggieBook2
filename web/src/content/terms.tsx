import { LegalContact, type LegalDocument } from '../components/layout/LegalPage'
import type { Strings } from '../i18n/useStrings'

// Terms of Use. Changing the text requires a new version and updated date.
// TERMS_VERSION must match TermsVersion in api/Auth/SignUpRules.cs.
export const TERMS_VERSION = '1.2'

const en: LegalDocument = {
  title: 'Terms of Use',
  version: TERMS_VERSION,
  updated: 'October 16, 2026',
  intro: (
    <>
      <p>
        <strong>
          By creating an account, or by using VeggieBook2 as a guest, you agree to
          these Terms of Use and to our Privacy Policy.
        </strong>{' '}
        If you do not agree, please do not use VeggieBook2.
      </p>
      <p>
        VeggieBook2 is part of a research project. Research tracking is{' '}
        <strong>on by default</strong> for signed-in accounts, and you can turn it
        off at any time in Profile and settings.
      </p>
    </>
  ),
  sections: [
    {
      id: 'about',
      heading: 'About VeggieBook2',
      body: (
        <p>
          VeggieBook2 is a free recipe book application developed at Kean
          University by the Department of Biological Sciences, under the
          direction of Dr. Kim Spaccarotella. It is a new version of the original
          VeggieBook application, created by Dr. Susan H. Evans and Dr. Peter
          Clarke at the University of Southern California. VeggieBook2 helps you
          build personal recipe books from the vegetables you have on hand.
        </p>
      ),
    },
    {
      id: 'free-to-use',
      heading: 'Free to Use',
      body: <p>VeggieBook2 is free. You may use it with an account or as a guest.</p>,
    },
    {
      id: 'eligibility',
      heading: 'Eligibility',
      body: <p>You must be 18 years of age or older to create an account.</p>,
    },
    {
      id: 'your-account',
      heading: 'Your Account',
      body: (
        <>
          <p>
            You are responsible for your account. Keep your password, recovery PIN,
            and security answer to yourself, and do not share your account with
            anyone. VeggieBook2 is not responsible for anything that happens
            through your account, including loss of access or loss of saved books.
          </p>
          <p>
            If you forget your password, you can reset it with your recovery PIN or
            your security question. If you forget all three, we may not be able to
            restore your account. You can contact the VeggieBook2 team, but we
            cannot promise to recover it.
          </p>
          <p>
            You may delete your account at any time from Profile and settings.{' '}
            <strong>Deleted accounts cannot be recovered</strong>, and all books in
            the account are deleted with it.
          </p>
        </>
      ),
    },
    {
      id: 'privacy-of-your-books',
      heading: 'Privacy of Your Books',
      body: (
        <p>
          Your books and cover photos belong to your account. Other users cannot
          view them.
        </p>
      ),
    },
    {
      id: 'guest-visits',
      heading: 'Guest Visits',
      body: (
        <p>
          Books made during a guest visit are kept until the visit ends, or for up
          to 24 hours. After that, they are permanently deleted and cannot be
          recovered. If you create an account during a guest visit, you may move
          your guest books into it or start fresh. Guest visits are never part of
          research.
        </p>
      ),
    },
    {
      id: 'research-tracking',
      heading: 'Research Tracking',
      body: (
        <>
          <p>
            VeggieBook2 is part of a research project at Kean University, and
            research studies are held from time to time.
          </p>
          <p>
            Research tracking is <strong>on by default</strong> for every
            signed-in account. Your choices in the application are recorded only
            while a study is running, and only under an anonymous research ID,
            never your name. The Privacy Policy explains exactly what is recorded.
          </p>
          <p>
            You may turn research tracking off at any time in Profile and settings.
            While it is off, nothing you do is recorded, and books you save are
            not used in research. If a study starts while your tracking is off,
            you will see a notice and can choose to join or stay out.
          </p>
          <p>
            The research team may also turn tracking off for an account. Using
            VeggieBook2 is free whether research tracking is on or off.
          </p>
        </>
      ),
    },
    {
      id: 'fair-use',
      heading: 'Fair Use',
      body: (
        <p>
          You agree not to attempt to disrupt the service, or to access any part
          of it that you are not authorized to use.
        </p>
      ),
    },
    {
      id: 'health-information',
      heading: 'Health Information',
      body: (
        <p>
          Recipes and tips in VeggieBook2 are provided for general educational
          purposes only and are not medical advice. If you have food allergies, a
          medical condition, or dietary restrictions, review all ingredients
          carefully and consult a physician or registered dietitian when in
          doubt.
        </p>
      ),
    },
    {
      id: 'disclaimer',
      heading: 'Disclaimer',
      body: (
        <p>
          VeggieBook2 is provided "as is." We make reasonable efforts to keep the
          service available and accurate, but features may change, and the
          service may occasionally be unavailable.
        </p>
      ),
    },
    {
      id: 'credits',
      heading: 'Credits',
      body: (
        <p>
          Recipes and content are from the original VeggieBook project by Dr.
          Susan H. Evans and Dr. Peter Clarke, University of Southern California,
          and are shared under the Creative Commons Attribution-ShareAlike 4.0
          International License. Full credits are available on the About page.
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
      heading: 'Changes to These Terms',
      body: (
        <p>
          If these terms are updated, the version number will change, and you
          will be asked to review and accept the new version.
        </p>
      ),
    },
  ],
}

const es: LegalDocument = {
  title: 'Términos de Uso',
  version: TERMS_VERSION,
  updated: '16 de octubre de 2026',
  intro: (
    <>
      <p>
        <strong>
          Al crear una cuenta, o al usar VeggieBook2 como invitado, aceptas estos
          Términos de Uso y nuestra Política de Privacidad.
        </strong>{' '}
        Si no estás de acuerdo, por favor no uses VeggieBook2.
      </p>
      <p>
        VeggieBook2 es parte de un proyecto de investigación. El seguimiento para
        la investigación está <strong>activado de forma predeterminada</strong> en
        las cuentas registradas, y puedes desactivarlo en cualquier momento en
        Perfil y configuración.
      </p>
      <p>
        Esta es una traducción del original en inglés. Si hay alguna diferencia,
        la versión en inglés es la que vale.
      </p>
    </>
  ),
  sections: [
    {
      id: 'about',
      heading: 'Acerca de VeggieBook2',
      body: (
        <p>
          VeggieBook2 es una aplicación gratuita de libros de recetas desarrollada
          en Kean University por el Departamento de Ciencias Biológicas, bajo la
          dirección de la Dra. Kim Spaccarotella. Es una nueva versión de la
          aplicación original VeggieBook, creada por la Dra. Susan H. Evans y el
          Dr. Peter Clarke en la Universidad del Sur de California. VeggieBook2 te
          ayuda a crear libros de recetas personales con las verduras que tienes
          en casa.
        </p>
      ),
    },
    {
      id: 'free-to-use',
      heading: 'Uso Gratuito',
      body: <p>VeggieBook2 es gratis. Puedes usarlo con una cuenta o como invitado.</p>,
    },
    {
      id: 'eligibility',
      heading: 'Requisitos',
      body: <p>Debes tener 18 años o más para crear una cuenta.</p>,
    },
    {
      id: 'your-account',
      heading: 'Tu Cuenta',
      body: (
        <>
          <p>
            Eres responsable de tu cuenta. No compartas tu contraseña, tu PIN de
            recuperación ni tu respuesta de seguridad, y no compartas tu cuenta
            con nadie. VeggieBook2 no es responsable de nada de lo que ocurra a
            través de tu cuenta, incluida la pérdida de acceso o de libros
            guardados.
          </p>
          <p>
            Si olvidas tu contraseña, puedes restablecerla con tu PIN de
            recuperación o con tu pregunta de seguridad. Si olvidas los tres, es
            posible que no podamos recuperar tu cuenta. Puedes comunicarte con el
            equipo de VeggieBook2, pero no podemos prometer que la recuperaremos.
          </p>
          <p>
            Puedes eliminar tu cuenta en cualquier momento desde Perfil y
            configuración. <strong>Las cuentas eliminadas no se pueden recuperar</strong>,
            y todos los libros de la cuenta se eliminan con ella.
          </p>
        </>
      ),
    },
    {
      id: 'privacy-of-your-books',
      heading: 'Privacidad de Tus Libros',
      body: (
        <p>
          Tus libros y fotos de portada pertenecen a tu cuenta. Otros usuarios no
          pueden verlos.
        </p>
      ),
    },
    {
      id: 'guest-visits',
      heading: 'Visitas como Invitado',
      body: (
        <p>
          Los libros que hagas como invitado se guardan hasta que termine la
          visita, o por un máximo de 24 horas. Después, se eliminan para siempre y
          no se pueden recuperar. Si creas una cuenta durante una visita como
          invitado, puedes pasar tus libros de invitado a la cuenta o empezar de
          nuevo. Las visitas como invitado nunca forman parte de la investigación.
        </p>
      ),
    },
    {
      id: 'research-tracking',
      heading: 'Seguimiento para la Investigación',
      body: (
        <>
          <p>
            VeggieBook2 es parte de un proyecto de investigación de Kean
            University, y de vez en cuando se realizan estudios de investigación.
          </p>
          <p>
            El seguimiento para la investigación está{' '}
            <strong>activado de forma predeterminada</strong> en todas las cuentas
            registradas. Tus elecciones en la aplicación se registran solo
            mientras hay un estudio en curso, y solo con un código de
            investigación anónimo, nunca con tu nombre. La Política de Privacidad
            explica exactamente qué se registra.
          </p>
          <p>
            Puedes desactivar el seguimiento en cualquier momento en Perfil y
            configuración. Mientras esté desactivado, no se registra nada de lo
            que haces, y los libros que guardes no se usan en la investigación. Si
            empieza un estudio mientras tu seguimiento está desactivado, verás un
            aviso y podrás elegir participar o no.
          </p>
          <p>
            El equipo de investigación también puede desactivar el seguimiento de
            una cuenta. Usar VeggieBook2 es gratis, con el seguimiento activado o
            desactivado.
          </p>
        </>
      ),
    },
    {
      id: 'fair-use',
      heading: 'Uso Adecuado',
      body: (
        <p>
          Aceptas no intentar interrumpir el servicio ni acceder a ninguna parte
          de él que no estés autorizado a usar.
        </p>
      ),
    },
    {
      id: 'health-information',
      heading: 'Información de Salud',
      body: (
        <p>
          Las recetas y los consejos de VeggieBook2 son solo para fines educativos
          generales y no son consejos médicos. Si tienes alergias alimentarias,
          una condición médica o restricciones en tu dieta, revisa bien todos los
          ingredientes y, si tienes dudas, consulta a un médico o a un dietista
          registrado.
        </p>
      ),
    },
    {
      id: 'disclaimer',
      heading: 'Aviso Legal',
      body: (
        <p>
          VeggieBook2 se ofrece "tal como está". Hacemos esfuerzos razonables para
          mantener el servicio disponible y correcto, pero las funciones pueden
          cambiar y el servicio puede no estar disponible en algunos momentos.
        </p>
      ),
    },
    {
      id: 'credits',
      heading: 'Créditos',
      body: (
        <p>
          Las recetas y el contenido provienen del proyecto original VeggieBook de
          la Dra. Susan H. Evans y el Dr. Peter Clarke, Universidad del Sur de
          California, y se comparten bajo la licencia Creative Commons
          Attribution-ShareAlike 4.0 International. Los créditos completos están
          en la página Acerca de.
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
      heading: 'Cambios en Estos Términos',
      body: (
        <p>
          Si estos términos se actualizan, el número de versión cambiará y se te
          pedirá que revises y aceptes la nueva versión.
        </p>
      ),
    },
  ],
}

export const TERMS: Strings<LegalDocument> = { en, es }