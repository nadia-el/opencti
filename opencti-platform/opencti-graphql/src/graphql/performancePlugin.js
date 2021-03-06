import { logger } from '../config/conf';

export default {
  requestDidStart: /* istanbul ignore next */ () => {
    const start = Date.now();
    let op;
    return {
      didResolveOperation: (context) => {
        op = context.operationName;
      },
      willSendResponse: (context) => {
        const stop = Date.now();
        const elapsed = stop - start;
        const size = JSON.stringify(context.response).length * 2;
        const isWrite = context.operation && context.operation.operation === 'mutation';
        const operationType = `${isWrite ? 'WRITE' : 'READ'}`;
        logger.info(`[PERF] API Call`, {
          type: operationType,
          operation: op,
          time: elapsed,
          size,
          errors: context.errors,
        });
      },
    };
  },
};
