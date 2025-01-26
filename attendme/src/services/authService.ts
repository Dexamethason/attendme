import { AttendMeBackendClient } from "@/services/attendmeClient";

const apiClient = new AttendMeBackendClient("https://attendme-backend.runasp.net", window);

export async function loginUser(loginName: string, password: string) {
    try {
        const response = await apiClient.login(loginName, password);
        return response; // Token zwracany przez API
    } catch (error) {
        console.error("Błąd logowania:", error);
        throw error;
    }
}
