import { ScreenLabel } from '../components/layout/ScreenLabel'
import { SafeImage } from '../components/common/SafeImage'
import { WHO_SAYS_SO } from '../i18n/strings/whoSaysSo'
import { useStrings } from '../i18n/useStrings'

// "Who Says So?", reached from the Secrets category picker.
//
// In the original app this was not a screen but a web page the app loaded
// (veggiebook.mobi/static/whosaysso_en.html, and _es for Spanish). The text
// in strings/whoSaysSo.ts is copied word for word from those pages, and
// the photos are the same files, served from /images/whosaysso.
//
// Read only. Back returns to the category picker.

const PHOTO_DIR = '/images/whosaysso'

// Two rows of three, in the original's order.
const FAMILY_PHOTOS = [
  'Patricia_sm.jpeg',
  'Priscilla_sm.jpeg',
  'June_sm.jpeg',
  'Blanca_sm.jpeg',
  'Rebecca_sm.jpeg',
  'OSC_DoloresLopez_71014_sm.jpg',
]

export function WhoSaysSo() {
  const t = useStrings(WHO_SAYS_SO)

  return (
    <>
      <ScreenLabel>{t.title}</ScreenLabel>

      <article className="who">
        <div className="who-intro">
          <SafeImage
            className="who-maria"
            src={`${PHOTO_DIR}/MariaDiaz.jpg`}
            alt="Maria"
            loading="eager"
          />
          {t.intro.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="who-photos">
          {FAMILY_PHOTOS.map((file) => (
            <SafeImage key={file} className="who-photo" src={`${PHOTO_DIR}/${file}`} />
          ))}
        </div>

        <h2 className="who-heading">{t.heading}</h2>

        <ul className="who-quotes">
          {t.quotes.map((quote, i) => (
            <li key={i}>&ldquo;{quote}&rdquo;</li>
          ))}
        </ul>
      </article>
    </>
  )
}