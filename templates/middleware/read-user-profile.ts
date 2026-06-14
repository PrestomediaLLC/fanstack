import { CallableRequest } from 'firebase-functions/v2/https';
import { ActionContext } from '../action-context';

/**
 * Middleware: Read User Profile
 * Use ctx.auth and ctx.sql to read the user profile.
 */
export const readUserProfile = async (
	_req: CallableRequest,
	_ctx: ActionContext,
): Promise<void> => {
	// ctx.user = user;
};
