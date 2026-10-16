// Shared labels for the Terms of Use and Privacy Policy pages. Spanish uses tú.

const en = {
  versionLine: (version: string, updated: string) =>
    `Version ${version}, last updated ${updated}`,
  logoAlt: 'VeggieBook, Quick Help for Meals',
}

const es: typeof en = {
  versionLine: (version: string, updated: string) =>
    `Versión ${version}, actualizada el ${updated}`,
  logoAlt: 'VeggieBook, Ayuda Rápida para Comidas',
}

export const LEGAL = { en, es }