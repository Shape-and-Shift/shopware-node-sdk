import { AdminApi } from './admin.api';
import { Exception } from '../exception';

export type SyncOperatorPayload = {
  entity: string;
  action: SYNC_OPERATOR;
  payload: Record<string, any>;
};

export enum SYNC_OPERATOR {
  UPSERT = 'upsert',
  DELETE = 'delete',
}

export class SyncPayload extends Map<string, SyncOperatorPayload> {
  setOperator(
    entity: string,
    action: SYNC_OPERATOR,
    payload: Record<string, any>,
  ): this {
    if (!Object.values(SYNC_OPERATOR).includes(action)) {
      throw new Exception(
        `Action ${action} is not allowed, allowed types: upsert, delete`,
      );
    }

    return this.set(`${entity}-${action}`, {
      action,
      entity,
      payload,
    });
  }

  parse(): {
    [k: string]: SyncOperatorPayload;
  } {
    return Object.fromEntries(this);
  }
}

export class SyncApi extends AdminApi {
  sync(
    payload: SyncPayload,
    additionalPayload: Record<string, any> = {},
    additionalHeaders: Record<string, any> = {},
  ): Promise<any> {
    return this.post(
      '/_action/sync',
      {
        ...payload.parse(),
        ...additionalPayload,
      },
      {
        headers: this.getBasicHeaders(additionalHeaders),
      },
    );
  }
}
