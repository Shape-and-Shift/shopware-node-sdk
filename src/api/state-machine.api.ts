import { AdminApi } from './admin.api';

export class StateMachineApi extends AdminApi {
  getAvailableTransitions(
    entityName: string,
    entityId: string,
    stateFieldName: string | null = null,
  ): Promise<any> {
    const query = this.serializeUrl({ stateFieldName });

    return this.get(
      `/_action/state-machine/${entityName}/${entityId}/state?${query}`,
    );
  }
  transitionState(
    entityName: string,
    entityId: string,
    transition: string,
    stateFieldName: string | null = null,
  ): Promise<any> {
    const query = this.serializeUrl({ stateFieldName });

    return this.post(
      `/api/_action/state-machine/${entityName}/${entityId}/state/${transition}?${query}`,
    );
  }
}
