import { AdminApi } from './admin.api';

export class UserApi extends AdminApi {
  me(): Promise<any> {
    return this.get('/_info/me').then((resp) => resp.data);
  }
  updateMe(data: Record<string, any>): Promise<any> {
    return this.patch('/_info/me', data);
  }
  status(): Promise<any> {
    return this.get('/_info/ping');
  }
  deleteUser(userId: string): Promise<any> {
    return this.delete(`/user/${userId}`);
  }
  deleteUserAccessKey(userId: string, accessKeyId: string): Promise<any> {
    return this.delete(`/user/${userId}/access-keys/${accessKeyId}`);
  }
  upsertUser(data: Record<string, any>): Promise<any> {
    return this.post('/api/user', data);
  }
  updateUser(userId: string, data: Record<string, any>): Promise<any> {
    return this.post(`/api/user/${userId}`, data);
  }
  upsertRole(data: Record<string, any>): Promise<any> {
    return this.post('/api/acl-role', data);
  }
  updateRole(roleId: string, data: Record<string, any>): Promise<any> {
    return this.post(`/api/acl-role/${roleId}`, data);
  }
  deleteUserRole(userId: string, roleId: string): Promise<any> {
    return this.delete(`/api/user/${userId}/acl-roles/${roleId}`);
  }
  deleteRole(roleId: string): Promise<any> {
    return this.delete(`/api/acl-role/${roleId}`);
  }
}
