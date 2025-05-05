import Image from 'next/image';

export default function Spinner2({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-spin relative ${className}`}>
            <Image 
                src="/ballPadellLoading.svg" 
                alt="Loading..."
                fill
                className="object-contain"
                priority
            />
        </div>
    );
}