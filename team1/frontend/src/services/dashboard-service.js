import {BASE_URL} from "../config";

export const dashboardService = {
  // Get stats for the dashboard
  getStats: async () => {
    const response = await fetch(`${BASE_URL}/dashboard/stats/`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },
};
