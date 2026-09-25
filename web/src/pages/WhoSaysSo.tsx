import { ScreenLabel } from '../components/ScreenLabel'
import { SafeImage } from '../components/SafeImage'

// "Who Says So?", reached from the Secrets category picker.
//
// In the original app this was not a screen but a web page the app loaded
// (veggiebook.mobi/static/whosaysso_en.html). The text here is copied word
// for word from that page in the original backend repository
// (qhweb/qhmobile/static/whosaysso_en.html), and the photos are the same
// files, served from /images/whosaysso.
//
// English only for now. The Spanish page (whosaysso_es.html) is in the same
// folder and comes in with the English/Spanish toggle.
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

const QUOTES = [
  "Recipes are very versatile. We're cooking different and more healthy.",
  "Now, my son helps me with meals. It's fun together.",
  "We're eating dinner as a family and talking about our day.",
  "I've bonded with my daughters. We shop together and prepare our meals around vegetables.",
  'The sugar calculator helped us cut down on soft drinks.',
  'I have used the tips on how to store vegetables so they keep longer.',
  'The whole family is learning how to cook, instead of going out for fast food.',
  'There are lots of good breakfast and snack ideas.',
  "I'm learning new things about food and serving meals, and I'm having fun doing it.",
  'I have shared recipes and secrets with my family and friends. I even did a presentation about the materials at my apartment complex. Now, my church has asked me to talk about the phone app and healthy eating.',
  'Secrets to better shopping are great.',
  "I'm learning how to read package labels and not just buy whatever looks good.",
]

export function WhoSaysSo() {
  return (
    <>
      <ScreenLabel>Who Says So?</ScreenLabel>

      <article className="who">
        <div className="who-intro">
          <SafeImage
            className="who-maria"
            src={`${PHOTO_DIR}/MariaDiaz.jpg`}
            alt="Maria"
            loading="eager"
          />
          <p>Hi, I'm Maria. I'm a nurse, a mom, and a grandmother of two.</p>
          <p>
            Each Secret has been Mom-tested. Other families, just like yours, use
            these Secrets to improve eating and meals with their families. And,
            studies by University researchers agree that these Secrets really work!
          </p>
          <p>
            These Secrets are small, simple steps that you can take. And, these
            Secrets will bring BIG rewards in better eating right away. Secrets
            don't cost money; in fact, they save you money.
          </p>
        </div>

        <div className="who-photos">
          {FAMILY_PHOTOS.map((file) => (
            <SafeImage key={file} className="who-photo" src={`${PHOTO_DIR}/${file}`} />
          ))}
        </div>

        <h2 className="who-heading">
          Here's what Moms say about recipes in VeggieBooks and ideas they find in
          SecretsBooks:
        </h2>

        <ul className="who-quotes">
          {QUOTES.map((quote) => (
            <li key={quote}>&ldquo;{quote}&rdquo;</li>
          ))}
        </ul>
      </article>
    </>
  )
}