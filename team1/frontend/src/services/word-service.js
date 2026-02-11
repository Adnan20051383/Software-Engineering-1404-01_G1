import {BASE_URL} from "../config";

export const wordService = {
  getAllWords: async (search = "", page = 1, exact = false) => {
    const response = await fetch(
      `${BASE_URL}/words/?search=${encodeURIComponent(search)}&page=${page}&exact=${exact}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
      }
    );
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },
};
