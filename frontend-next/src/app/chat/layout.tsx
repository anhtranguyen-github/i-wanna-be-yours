// Chat routes use their own layout without the main sidebar
export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50">
            {children}
        </div>
    );
}
