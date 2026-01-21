// API клиент для управления Canvibe через туннель

const API_BASE = 'http://127.0.0.1:14141';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export class CanvibeApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  async getEvents(type?: string): Promise<ApiResponse<any[]>> {
    const url = type ? `/events?type=${type}` : '/events';
    return this.request(url);
  }

  async createEvent(eventType: string, data: any): Promise<ApiResponse> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, data }),
    });
  }

  async getEvent(id: string): Promise<ApiResponse> {
    return this.request(`/events/${id}`);
  }

  async getNodes(): Promise<ApiResponse<any[]>> {
    return this.request('/nodes');
  }

  async createNode(node: any): Promise<ApiResponse> {
    return this.request('/nodes', {
      method: 'POST',
      body: JSON.stringify(node),
    });
  }

  async getCanvasState(): Promise<ApiResponse> {
    return this.request('/canvas/state');
  }

  async updateCanvasState(updates: Record<string, any>): Promise<ApiResponse> {
    return this.request('/canvas/state', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  async setZoom(zoom: number): Promise<ApiResponse> {
    return this.request('/canvas/zoom', {
      method: 'POST',
      body: JSON.stringify({ zoom }),
    });
  }

  async setPosition(x: number, y: number): Promise<ApiResponse> {
    return this.request('/canvas/position', {
      method: 'POST',
      body: JSON.stringify({ x, y }),
    });
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
}

export const canvibeApi = new CanvibeApi();
