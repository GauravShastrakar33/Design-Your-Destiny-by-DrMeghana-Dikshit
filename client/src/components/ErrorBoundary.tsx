import React, { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        console.error("🔴 ErrorBoundary caught error:", error);
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("🔴 ErrorBoundary details:", {
            error: error.toString(),
            componentStack: errorInfo.componentStack,
            stack: error.stack,
        });
        this.setState({
            error,
            errorInfo,
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#ff4444",
                        color: "#ffffff",
                        zIndex: 99999,
                        padding: "20px",
                        overflowY: "auto",
                        fontFamily: "monospace",
                    }}
                >
                    <h2 style={{ marginBottom: "16px" }}>🛑 React Error Caught</h2>
                    <p style={{ marginBottom: "12px" }}>
                        <strong>Error:</strong> {this.state.error?.toString()}
                    </p>
                    {this.state.error?.stack && (
                        <div
                            style={{
                                background: "rgba(0,0,0,0.2)",
                                padding: "10px",
                                marginBottom: "12px",
                                fontSize: "12px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            }}
                        >
                            <strong>Stack:</strong>
                            <br />
                            {this.state.error.stack}
                        </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                        <div
                            style={{
                                background: "rgba(0,0,0,0.2)",
                                padding: "10px",
                                marginBottom: "12px",
                                fontSize: "12px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            }}
                        >
                            <strong>Component Stack:</strong>
                            <br />
                            {this.state.errorInfo.componentStack}
                        </div>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: "10px 20px",
                            background: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            color: "#333",
                        }}
                    >
                        RELOAD APP
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
