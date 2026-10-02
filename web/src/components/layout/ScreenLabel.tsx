// Thin gray strip under the masthead naming the current screen.
// "Select VeggieBook", "Choose the Secrets You Want", and so on.

type Props = {
  children: React.ReactNode
}

export function ScreenLabel({ children }: Props) {
  return <p className="screen-label">{children}</p>
}