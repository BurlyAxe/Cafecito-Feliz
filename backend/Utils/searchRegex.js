// Each plain letter also matches its accented forms, so "maria" finds "María"
const ACCENT_VARIANTS = {
    a: "[aáàäâ]",
    e: "[eéèëê]",
    i: "[iíìïî]",
    o: "[oóòöô]",
    u: "[uúùüû]",
    n: "[nñ]",
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Builds a case and accent insensitive "contains" filter for a $regex query.
// The search text is stripped of its own accents first, so "maría" also finds "Maria"
export const searchRegex = (text) => {
    const plain = text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();

    const pattern = escapeRegex(plain).replace(/[aeioun]/g, (letter) => ACCENT_VARIANTS[letter]);

    return { $regex: pattern, $options: "i" };
};
