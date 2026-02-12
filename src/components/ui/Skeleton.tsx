import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: "default" | "circle" | "card" | "text";
    rows?: number;
}

export function Skeleton({ className, variant = "default", rows = 1, ...props }: SkeletonProps) {
    const baseClasses = "animate-pulse rounded-md bg-gray-200/80 dark:bg-gray-800/80";

    if (variant === "circle") {
        return <div className={cn(baseClasses, "rounded-full", className)} {...props} />;
    }

    if (variant === "text") {
        return (
            <div className="space-y-2">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            baseClasses,
                            "h-4 w-full",
                            i === rows - 1 && rows > 1 ? "w-4/5" : "",
                            className
                        )}
                        {...props}
                    />
                ))}
            </div>
        );
    }

    if (variant === "card") {
        return (
            <div className={cn("rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3", className)} {...props}>
                <div className={cn(baseClasses, "h-32 w-full rounded-lg")} />
                <div className="space-y-2">
                    <div className={cn(baseClasses, "h-4 w-3/4")} />
                    <div className={cn(baseClasses, "h-4 w-1/2")} />
                </div>
            </div>
        );
    }

    return <div className={cn(baseClasses, className)} {...props} />;
}
