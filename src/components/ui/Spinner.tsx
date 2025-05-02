export default function Spinner({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-700/85 ${className}`} />
    );
}