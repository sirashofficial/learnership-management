'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorCatcher extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Render error caught by ErrorCatcher:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 border-2 border-red-500 bg-red-50 rounded-lg m-4">
                    <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong during rendering.</h2>
                    <p className="text-sm text-red-600 mb-4">{this.state.error?.message}</p>
                    <pre className="p-4 bg-black text-white rounded overflow-auto text-xs max-h-40">
                        {this.state.error?.stack}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
