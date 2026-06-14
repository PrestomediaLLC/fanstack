import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { ActionContext } from './action-context';
import { runAction } from './fan-actions.gen';
import { connectToDatabase } from './middleware/connect-to-database';
import { readEnvironment } from './middleware/read-environment';
import { readUserProfile } from './middleware/read-user-profile';
import { requireAuth } from './middleware/require-auth';

/**
 * Standard signature for all Fanstack middleware.
 * Mutate the `ctx` object to pass data to your actions, or throw an HttpsError to abort.
 */
export type FanstackMiddleware = (req: CallableRequest, ctx: ActionContext) => Promise<void>;

export const fanstack = async (request: CallableRequest): Promise<any> => {
	const actionName = request.data?.action;
	const payload = request.data?.payload;

	if (!actionName) {
		throw new HttpsError('invalid-argument', 'Missing action namespace.');
	}

	// Base context seeded automatically with native Firebase Auth!
	const ctx: ActionContext = {
		action: actionName,
		auth: request.auth,
	};

	try {
		// Define your middleware execution pipeline
		const middlewares: FanstackMiddleware[] = [
			requireAuth,
			readEnvironment,
			connectToDatabase,
			readUserProfile,
		];

		// Run middlewares sequentially
		for (const mw of middlewares) {
			await mw(request, ctx);
		}

		// Dispatch to the auto-generated router
		return await runAction(actionName, payload, ctx);
	} catch (err: any) {
		// Pass standard Firebase HttpsErrors through natively to the Angular client
		if (err instanceof HttpsError) throw err;

		// Fallback for unexpected crashes
		throw new HttpsError('internal', err.message || 'Internal Execution Error');
	}
};
