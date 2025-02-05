import { AttendMeBackendClient } from "@/services/attendmeClient";

const apiClient = new AttendMeBackendClient("https://attendme-backend.runasp.net", window);
const TOKEN_KEY = 'authToken';

export interface LoginResponse {
    token: string;
    expires?: Date;
}


export async function loginUser(username: string, password: string): Promise<LoginResponse> {
    try {
        const response = await apiClient.userLogin(username, password);
        
        if (!response || !response.token) {
            throw new Error('Invalid login response');
        }

        // Store the token
        localStorage.setItem(TOKEN_KEY, response.token);

        return {
            token: response.token,
            expires: response.expires
        };
    } catch (error) {
        console.error("Błąd logowania:", error);
        throw error;
    }
}