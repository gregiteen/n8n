import { PrivacyService, PrivacyImpactLevel } from './index';

describe('PrivacyService', () => {
	let privacyService: PrivacyService;

	beforeEach(() => {
		privacyService = new PrivacyService();
	});

	describe('redact', () => {
		it('should redact email addresses', () => {
			const text = 'Contact me at test@example.com for details';
			const redacted = privacyService.redact(text);
			expect(redacted).toEqual('Contact me at [REDACTED] for details');
		});

		it('should redact phone numbers', () => {
			const text = 'Call me at (555) 123-4567';
			const redacted = privacyService.redact(text);
			expect(redacted).toEqual('Call me at [REDACTED]');
		});

		it('should handle empty text', () => {
			const text = '';
			const redacted = privacyService.redact(text);
			expect(redacted).toEqual('');
		});
	});

	describe('assessPrivacyImpact', () => {
		it('should assess small data as NONE impact', () => {
			const impact = privacyService.assessPrivacyImpact('123');
			expect(impact).toEqual(PrivacyImpactLevel.NONE);
		});

		it('should assess medium data as MEDIUM impact', () => {
			const impact = privacyService.assessPrivacyImpact('x'.repeat(500));
			expect(impact).toEqual(PrivacyImpactLevel.MEDIUM);
		});

		it('should assess large data as HIGH impact', () => {
			const impact = privacyService.assessPrivacyImpact('x'.repeat(1500));
			expect(impact).toEqual(PrivacyImpactLevel.HIGH);
		});
	});
});
