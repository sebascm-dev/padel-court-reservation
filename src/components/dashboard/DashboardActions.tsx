import Link from 'next/link';

export default function DashboardActions() {
  return (
    <div className="flex flexrow items-center justify-center gap-4">
      <Link
        href="/reservation"
        className="flex items-center w-full justify-center gap-2 px-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
      >
        <svg 
          className="size-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span className="font-medium">Reservar Pista</span>
      </Link>

      <Link
        href="/available-matches"
        className="flex items-center justify-center w-full gap-2 px-2 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        <svg 
          className="size-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="font-medium">Buscar Partidos</span>
      </Link>
    </div>
  );
}