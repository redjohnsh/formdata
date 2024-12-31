type JSONValue = string | { [x: string]: JSONValue } | Array<JSONValue>;

/**
 * Encodes a nested object into FormData with appropriate brackets.
 * @param data - The object to encode
 * @returns A FormData instance
 */
export function encode(data: Record<string, unknown>): FormData {
	const formData = new FormData();

	const appendValue = (key: string, value: unknown): void => {
		if (value === null || value === undefined) {
			// Skip null or undefined values
		} else if (typeof value === "object" && !(value instanceof File)) {
			if (Array.isArray(value)) {
				// Handle arrays
				value.forEach((item, index) => appendValue(`${key}[${index}]`, item));
			} else {
				// Handle nested objects
				for (const subKey in value) {
					if (Object.prototype.hasOwnProperty.call(value, subKey)) {
						appendValue(
							`${key}[${subKey}]`,
							(value as Record<string, unknown>)[subKey],
						);
					}
				}
			}
		} else {
			// Handle primitive values and files
			formData.append(key, value as string | Blob);
		}
	};

	for (const key in data) {
		if (Object.prototype.hasOwnProperty.call(data, key)) {
			appendValue(key, data[key]);
		}
	}

	return formData;
}

/**
 * Decodes a FormData instance into a complex nested object.
 *
 * @param {FormData} formData - The FormData instance to decode.
 * @returns {JSONValue} - A structured object representing the FormData.
 */
export function decode(formData: FormData): JSONValue {
	const result: JSONValue = {};

	const setNestedValue = (
		target: Record<string, unknown>,
		keys: readonly string[],
		value: unknown,
	): void => {
		let current = target;

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const isLast = i === keys.length - 1;

			if (isLast) {
				current[key] = value;
			} else {
				if (!current[key]) {
					// Next key is numeric, so this should be an array
					if (/^\d+$/.test(keys[i + 1])) {
						current[key] = [];
					} else {
						current[key] = {};
					}
				}

				current = current[key] as Record<string, unknown>;
			}
		}
	};

	for (const [rawKey, value] of formData.entries()) {
		const keys = rawKey.split(/[\[\]]+/).filter((key) => key.length);
		setNestedValue(result, keys, value);
	}

	return result;
}
