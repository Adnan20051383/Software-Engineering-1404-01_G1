const BASE_URL = "http://localhost:8000/team1";

export const wordService = {
    getAllWords: async (page = 1) => {
        const response = await fetch(`${BASE_URL}/words/?page=${page}`);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    }
};