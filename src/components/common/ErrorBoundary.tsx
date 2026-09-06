import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl animate-slide-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-white">Terjadi kendala pada tampilan</h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Aplikasi mengalami kendala sementara saat merender tampilan. Kamu bisa kembali ke beranda tanpa kehilangan data browser.
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReset}
              className="w-full min-h-[44px] px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm shadow-glow flex items-center justify-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
