import { TokenSenseEmbeddings } from '../nodes/TokenSenseEmbeddings/TokenSenseEmbeddings.node';

describe('TokenSenseEmbeddings node', () => {
	let node: TokenSenseEmbeddings;

	beforeEach(() => {
		node = new TokenSenseEmbeddings();
	});

	it('has displayName "TokenSense Embeddings"', () => {
		expect(node.description.displayName).toBe('TokenSense Embeddings');
	});

	it('has name "tokenSenseEmbeddings"', () => {
		expect(node.description.name).toBe('tokenSenseEmbeddings');
	});

	it('outputs ai_embedding', () => {
		expect(node.description.outputs as string[]).toContain('ai_embedding');
	});

	it('requires tokenSenseApi credential', () => {
		const creds = node.description.credentials ?? [];
		expect(creds.some((c) => c.name === 'tokenSenseApi')).toBe(true);
	});

	it('has model property', () => {
		const names = node.description.properties.map((p) => p.name);
		expect(names).toContain('model');
	});

	it('has dimensions property', () => {
		const names = node.description.properties.map((p) => p.name);
		expect(names).toContain('dimensions');
	});

	it('has loadOptions.getEmbeddingModels method', () => {
		expect(typeof node.methods?.loadOptions?.getEmbeddingModels).toBe('function');
	});

	it('has supplyData method', () => {
		expect(typeof node.supplyData).toBe('function');
	});
});
