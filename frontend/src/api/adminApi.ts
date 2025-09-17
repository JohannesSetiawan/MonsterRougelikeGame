const API_BASE_URL = 'http://localhost:3001';

export interface JsonFileInfo {
  name: string;
  path: string;
  data: Record<string, any>;
  schema?: Record<string, any>;
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  message: string;
}

export interface AdminResponse {
  success: boolean;
  message: string;
  file?: JsonFileInfo;
}

export interface FileSchema {
  schema: Record<string, any>;
  sample?: any;
}

class AdminApi {
  private token: string | null = null;

  /**
   * Login with admin credentials
   */
  async login(username: string, password: string): Promise<AdminLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result = await response.json();
    this.token = result.token;
    return result;
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Basic ${this.token}`;
    }

    return headers;
  }

  /**
   * Get all JSON files
   */
  async getAllFiles(): Promise<JsonFileInfo[]> {
    const response = await fetch(`${API_BASE_URL}/admin/files`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch files');
    }

    return response.json();
  }

  /**
   * Get available file names
   */
  async getFilesList(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/admin/files/list`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch files list');
    }

    return response.json();
  }

  /**
   * Get specific JSON file
   */
  async getFile(filename: string): Promise<JsonFileInfo> {
    const response = await fetch(`${API_BASE_URL}/admin/files/${filename}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch file');
    }

    return response.json();
  }

  /**
   * Update entire JSON file
   */
  async updateFile(filename: string, data: Record<string, any>): Promise<AdminResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/files/${filename}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update file');
    }

    return response.json();
  }

  /**
   * Create new entry in JSON file
   */
  async createEntry(filename: string, key: string, value: any): Promise<AdminResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/files/${filename}/entries`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ key, value }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create entry');
    }

    return response.json();
  }

  /**
   * Update existing entry in JSON file
   */
  async updateEntry(filename: string, key: string, value: any): Promise<AdminResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/files/${filename}/entries/${key}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update entry');
    }

    return response.json();
  }

  /**
   * Delete entry from JSON file
   */
  async deleteEntry(filename: string, key: string): Promise<AdminResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/files/${filename}/entries/${key}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete entry');
    }

    return response.json();
  }

  /**
   * Get file schema
   */
  async getFileSchema(filename: string): Promise<FileSchema> {
    const response = await fetch(`${API_BASE_URL}/admin/files/${filename}/schema`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch schema');
    }

    return response.json();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Logout
   */
  logout() {
    this.token = null;
  }
}

export const adminApi = new AdminApi();