export const buildQuery = (
    params: Record<string, string | number | boolean | undefined>,
) => {
    const serialized = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== "")
        .map(([key, value]) => [key, String(value)]);

    return new URLSearchParams(serialized).toString();
};