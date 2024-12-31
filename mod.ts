/**
 * @module
 *
 * A lightweight TypeScript utility for encoding JSON-like objects into FormData
 * and decoding FormData back into structured data. This module supports nested
 * objects and arrays, preserving array order and adhering to common FormData key
 * conventions using bracket notation.
 *
 * ## Features
 * - Encode nested objects and arrays into FormData.
 * - Decode FormData back into a JSON-like object.
 * - Preserves array order and reconstructs complex structures.
 *
 * ## Usage
 *
 * ### Encoding a Complex Object
 * ```typescript
 * import { encode } from "@rj/formdata";
 *
 * const data = {
 *   email: "john@doe.com",
 *   address: { city: "New York", zip: 10001 },
 *   tags: ["foo", "bar"],
 * };
 *
 * const formData = encode(data);
 * // Result:
 * // email: "john@doe.com"
 * // address[city]: "New York"
 * // address[zip]: "10001"
 * // tags[0]: "foo"
 * // tags[1]: "bar"
 * ```
 *
 * ### Decoding FormData
 * ```typescript
 * import { decode } from "@rj/formdata";
 *
 * const formData = new FormData();
 * formData.append("email", "john@doe.com");
 * formData.append("address[city]", "New York");
 * formData.append("address[zip]", "10001");
 * formData.append("tags[0]", "foo");
 * formData.append("tags[1]", "bar");
 *
 * const data = decode(formData);
 * // Result:
 * // {
 * //   email: "john@doe.com",
 * //   address: { city: "New York", zip: "10001" },
 * //   tags: ["foo", "bar"],
 * // }
 * ```
 *
 * ### Nested Objects in Arrays
 * ```typescript
 * const formData = new FormData();
 * formData.append("users[0][name]", "john doe");
 * formData.append("users[1][name]", "jane doe");
 * formData.append("users[0][tags][0]", "foo");
 *
 * const data = decode(formData);
 * // Result:
 * // {
 * //   users: [
 * //     { name: "john doe", tags: ["foo"] },
 * //     { name: "jane doe" },
 * //   ],
 * // }
 * ```
 *
 * ## API
 *
 * ### encode(data: Record<string, unknown>): FormData
 * Encodes a JSON-like object into a FormData instance using bracket notation.
 *
 * - **Arguments**:
 *   - `data`: A JSON-like object to encode.
 * - **Returns**: A FormData instance.
 *
 * ### decode(formData: FormData): Record<string, unknown>
 * Decodes a FormData instance into a structured JSON-like object.
 *
 * - **Arguments**:
 *   - `formData`: The FormData instance to decode.
 * - **Returns**: A JSON-like object.
 *
 * ## License
 * MIT
 */

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
export function decode(formData: FormData): Record<string, unknown> {
	const result: Record<string, unknown> = {};

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
