import api from "./api";

class SettingsService {
  async getPublicConfig() {
    const response = await api.get("/settings/public");
    return response.data;
  }

  async getDomainSettings(domain) {
    const response = await api.get(`/settings/${domain}`);
    return response.data;
  }

  async updateDomainSettings(domain, data) {
    const response = await api.put(`/settings/${domain}`, data);
    return response.data;
  }

  async testSmtp(data) {
    const response = await api.post("/settings/smtp/test", data);
    return response.data;
  }
}

export default new SettingsService();
