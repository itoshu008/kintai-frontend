import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  state: State = {};
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('[ErrorBoundary]', error); }
  render() {
    if (this.state.error) {
      return (
        <pre style={{
          whiteSpace:'pre-wrap', padding:12,
          background:'#111', color:'#f55', border:'1px solid #f55'
        }}>
          {String(this.state.error.stack || this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}