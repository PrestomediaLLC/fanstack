import { CallableRequest } from 'firebase-functions/v2/https';
import { ActionContext } from '../action-context';
// import { Environment } from '../../environment';

/**
 * Middleware: Read Environment
 * Attach the environment configuration so the actions have it easily available
 */
export const readEnvironment = async (
	_req: CallableRequest,
	_ctx: ActionContext,
): Promise<void> => {
	// ctx.env = environment;
};
