import { inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

/**
 * Modern Base implementation for Fanstack cross-wire service handlers.
 * Leverages native Firebase Functions callables for seamless auth token management and validation.
 */
export class FuncServiceBase {
	protected functions = inject(Functions);

	protected _call<IN, OUT>(actionName: string): (payload: IN) => Promise<OUT> {
		return async (payload: IN): Promise<OUT> => {
			const callable = httpsCallable<{ action: string; payload: IN }, OUT>(
				this.functions,
				'action',
			);
			const result = await callable({ action: actionName, payload });
			return result.data;
		};
	}

	protected _callNoPayload<OUT>(actionName: string): () => Promise<OUT> {
		const executedCall = this._call<void, OUT>(actionName);
		return () => executedCall(undefined);
	}
}
