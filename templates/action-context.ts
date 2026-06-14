import { CallableRequest } from 'firebase-functions/v2/https';

export interface ActionContext {
	//
	// TODO: Add whatever properties you would like passed to each action function.
	// You can tack on the values within custom middleware.
	//
	// env?: any;       // Populated by readEnvironment
	// sql?: any;       // Populated by connectToDatabase
	// user?: any;      // Populated by readUserProfile
	// logger?: any;    // A custom logger example
	//

	/**
	 * The name of the action being executed.  Use this to make decisions in your
	 * middleware or action function.  For instance, requireAuth might selectively
	 * skip an action by name.
	 */
	action: string;

	/**
	 * Native Firebase Authentication Token.
	 * Defined if the user is signed in via standard Firebase Auth.
	 */
	auth: CallableRequest['auth'];

	/**
	 * The raw Google Account Id (sub) extracted from the Firebase token.
	 * Only present if the user signed in with Google. This is needed to call
	 * Google Cloud APIs such as Google Drive, Calendar, or GCP services.
	 */
	googleId?: string;
}
