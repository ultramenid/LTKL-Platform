import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Catches render errors in child tree so one broken section doesn't crash the whole app
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Terjadi kesalahan</p>
            {this.props.label && (
              <p className="text-xs text-gray-400 mt-0.5">{this.props.label}</p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
            Coba lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
