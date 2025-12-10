import * as React from "react"
import { cn } from "@/lib/utils"

interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
}

const ClayCard = React.forwardRef<HTMLDivElement, ClayCardProps>(
    ({ className, style, title, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "clay-card p-6 transition-all duration-300",
                    className
                )}
                style={{
                    // Default background if not overridden by className or style
                    // CSS variable fallback handles the color
                    ...style
                }}
                {...props}
            >
                {title && (
                    <h3
                        className="text-xl font-bold mb-4"
                        style={{ color: 'hsl(var(--primary))' }}
                    >
                        {title}
                    </h3>
                )}
                <div className="relative z-10">
                    {children}
                </div>
            </div>
        )
    }
)
ClayCard.displayName = "ClayCard"

export { ClayCard }
