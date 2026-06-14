import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { ActionContext } from '../action-context';

// Add any action namespaces here that should bypass authentication
const PUBLIC_ACTIONS = [
	'example.sayHello',
	// 'users.register',
];

/**
 * Middleware: Require Auth
 * Rejects the request immediately if the user is not signed in.
 */
export const requireAuth = async (_req: CallableRequest, ctx: ActionContext): Promise<void> => {
	//
	// Attempt to get the googleId (sub) whether this is a public action or not
	//
	if (ctx.auth?.token?.firebase?.identities) {
		const googleIdentities = ctx.auth.token.firebase.identities['google.com'];

		// If the array exists and has at least one ID, the first one is the sub.
		if (googleIdentities && googleIdentities.length > 0) {
			ctx.googleId = googleIdentities[0];
		}
	}

	//
	// Skip auth enforcement for explicitly public actions
	//
	if (PUBLIC_ACTIONS.includes(ctx.action)) return;

	if (!ctx.auth?.uid) {
		throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
	}
};
