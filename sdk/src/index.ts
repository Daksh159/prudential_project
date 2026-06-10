import axios, { AxiosInstance } from 'axios'

export interface Role {
  id: number
  name: string
  description: string
  created_at: string
}

export interface Permission {
  id: number
  action: string
  resource: string
  description: string
}

export interface Policy {
  id: number
  name: string
  natural_language_text: string
  structured_rules: unknown
  created_at: string
  is_active: boolean
}

export interface RBACConfig {
  apiKey: string
  serverUrl: string
}

export class RBAC {
  private http: AxiosInstance

  constructor(config: RBACConfig) {
    this.http = axios.create({
      baseURL: config.serverUrl,
      headers: { Authorization: `Bearer ${config.apiKey}` },
    })
  }

  /** Check whether a user can perform an action on a resource. */
  async can(userId: number, action: string, resource: string): Promise<boolean> {
    const res = await this.http.post('/check-access', { user_id: userId, action, resource })
    return res.data.allowed as boolean
  }

  /** Get all roles assigned to a user. */
  async getUserRoles(userId: number): Promise<Role[]> {
    const res = await this.http.get(`/users/${userId}/roles`)
    return res.data as Role[]
  }

  /** Get all permissions for a role. */
  async getPermissions(roleId: number): Promise<Permission[]> {
    const res = await this.http.get(`/roles/${roleId}/permissions`)
    return res.data as Permission[]
  }

  /** Assign a role to a user. */
  async assignRole(userId: number, roleId: number): Promise<void> {
    await this.http.post(`/users/${userId}/roles/${roleId}`)
  }

  /** Remove a role from a user. */
  async removeRole(userId: number, roleId: number): Promise<void> {
    await this.http.delete(`/users/${userId}/roles/${roleId}`)
  }

  /** Create a policy from natural language (uses AI). */
  async createPolicy(text: string): Promise<Policy> {
    const rulesRes = await this.http.post('/ai/generate-policy', { text })
    const policyRes = await this.http.post('/policies', {
      name: `Policy: ${text.slice(0, 40)}`,
      natural_language_text: text,
      structured_rules: rulesRes.data.rules,
    })
    return policyRes.data as Policy
  }

  /** List all roles in the system. */
  async listRoles(): Promise<Role[]> {
    const res = await this.http.get('/roles')
    return res.data as Role[]
  }

  /** Detect security risks for a role's permissions. */
  async detectRisks(roleId: number): Promise<{ permission: string; risk_level: string; reason: string }[]> {
    const res = await this.http.post('/ai/detect-risks', { role_id: roleId })
    return res.data.risks
  }
}

export default RBAC
