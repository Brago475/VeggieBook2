import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CrashScreen } from './CrashScreen'

// Shows the crash screen instead of a blank page when a screen fails to render.

type Props = { children: ReactNode }
type State = { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen failed to render', error, info.componentStack)
  }

  render() {
    return this.state.failed ? <CrashScreen /> : this.props.children
  }
}