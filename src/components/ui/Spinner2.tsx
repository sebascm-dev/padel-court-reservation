export default function Spinner2({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-spin ${className}`}>
            <img 
                src="/ballPadellLoading.svg" 
                alt="Loading..."
                className="size-full object-cover"
            />
        </div>
    );
}