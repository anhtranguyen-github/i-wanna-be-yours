// Chat layout - uses main app layout sidebar
// This just ensures chat pages fill the available space

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-[calc(100vh)] w-full">
            {children}
        </div>
    );
}
