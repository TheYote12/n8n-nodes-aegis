import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	ISupplyDataFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type MetadataContext = IExecuteFunctions | ISupplyDataFunctions;

/**
 * Normalize a TokenSense endpoint to the bare origin.
 *
 * Strips any trailing slashes and any trailing `/v1` segment so callers can
 * build URLs like `${normalizeBaseUrl(endpoint)}/v1/...` without doubling up.
 * The credential-level regex blocks `/v1` at input time, but this helper is
 * defence-in-depth for credentials saved before the regex validator shipped
 * and for code paths that receive the raw endpoint value.
 */
export function normalizeBaseUrl(input: string): string {
	let current = String(input).trim();
	let previous = '';
	while (current !== previous) {
		previous = current;
		current = current.replace(/\/+$/, '').replace(/\/v1$/, '');
	}
	return current;
}

/**
 * Build the metadata Record sent with every TokenSense API call.
 *
 * - `source` is always set.
 * - `workflow_tag` comes from the manual field, falling back to the workflow name.
 * - `project` is included when non-empty.
 * - `provider` is only included when `options.includeProvider` is `true` — callers
 *   must opt in explicitly. Only pass `includeProvider: true` when the node actually
 *   exposes a `providerOverride` field; otherwise n8n may return a stale stored value
 *   from a previous execution that had the field visible.
 *
 * `project` and `workflowTag` must exist on every calling node; a missing
 * parameter there is a real bug, not something to swallow.
 */
export function buildMetadata(
	context: MetadataContext,
	itemIndex: number,
	options?: { includeProvider?: boolean },
): Record<string, string> {
	const workflowTag = context.getNodeParameter('workflowTag', itemIndex, '') as string;
	const effectiveTag = workflowTag || context.getWorkflow().name || '';
	const project = context.getNodeParameter('project', itemIndex, '') as string;

	const metadata: Record<string, string> = { source: 'n8n-nodes-tokensense' };
	if (effectiveTag) metadata.workflow_tag = effectiveTag;
	if (project) metadata.project = project;

	if (options?.includeProvider) {
		const providerOverride = context.getNodeParameter('providerOverride', itemIndex, 'auto') as string;
		if (providerOverride && providerOverride !== 'auto') metadata.provider = providerOverride;
	}

	const step = context.getNode().name;
	const executionId = context.getExecutionId();
	if (step) metadata.step = step;
	if (executionId) metadata.execution_id = executionId;

	return metadata;
}

const DEFAULT_MODELS: INodePropertyOptions[] = [
	{ name: 'GPT-5.5', value: 'gpt-5.5' },
	{ name: 'GPT-5.4 Mini', value: 'gpt-5.4-mini' },
	{ name: 'GPT-4.1', value: 'gpt-4.1' },
	{ name: 'GPT-4.1 Mini', value: 'gpt-4.1-mini' },
	{ name: 'Claude Opus 4.7', value: 'claude-opus-4-7' },
	{ name: 'Claude Sonnet 4.6', value: 'claude-sonnet-4-6' },
	{ name: 'Claude Haiku 4.5', value: 'claude-haiku-4-5' },
	{ name: 'Gemini 3 Flash Preview', value: 'gemini-3-flash-preview' },
	{ name: 'Gemini 3.1 Pro Preview', value: 'gemini-3.1-pro-preview' },
	{ name: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
];

/**
 * Load models from the TokenSense /v1/models endpoint.
 *
 * @param filter  - Optional predicate applied to each model id (e.g. embedding filter).
 * @param fallback - Fallback list returned when the API call fails or the filter
 *                   yields no results. Defaults to the standard chat-model list.
 */
export async function loadModels(
	this: ILoadOptionsFunctions,
	filter?: (id: string) => boolean,
	fallback?: INodePropertyOptions[],
): Promise<INodePropertyOptions[]> {
	try {
		const credentials = await this.getCredentials('tokenSenseApi');
		const baseUrl = normalizeBaseUrl(credentials.endpoint as string);
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'tokenSenseApi',
			{
				method: 'GET',
				baseURL: baseUrl,
				url: '/v1/models',
			},
		);
		let models = (response as { data?: Array<{ id: string }> }).data ?? [];
		if (filter) {
			const filtered = models.filter((m) => filter(m.id));
			if (filtered.length === 0) throw new NodeOperationError(
				this.getNode(),
				'No models matched filter',
				{ description: 'Adjust the model filter expression or remove it to see all available models' },
			);
			models = filtered;
		}
		return models.map((m) => ({ name: m.id, value: m.id }));
	} catch {
		return fallback ?? DEFAULT_MODELS;
	}
}
