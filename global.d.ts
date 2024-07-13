declare global {
    interface Window {
        turnstile: {
            render: (id: string, options: { sitekey: string, callback: (token: string) => void }) => void;
        };
    }
}

export {};
