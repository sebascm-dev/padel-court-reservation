export const getNivelDescription = (nivel: string | undefined): string => {
    if (!nivel) return "5 (Medio)";
    
    const nivelNum = parseInt(nivel);
    switch (nivelNum) {
        case 1:
            return "1 (Muy Bajo)";
        case 2:
            return "2 (Bajo)";
        case 3:
            return "3 (Bajo/Medio)";
        case 4:
            return "4 (Medio)";
        case 5:
            return "5 (Medio/Alto)";
        case 6:
            return "6 (Alto)";
        case 7:
            return "7 (Muy Alto)";
        case 8:
            return "8 (Experto)";
        case 9:
            return "9 (Profesional)";
        case 10:
            return "10 (Profesional Experto)";
        default:
            return "5 (Medio/Alto)";
    }
};