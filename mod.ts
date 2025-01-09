/**
 * @module
 *
 * A lightweight utility for working with `FormData`, enabling the encoding of
 * complex objects into `FormData` and decoding `FormData` back into structured objects.
 * This module preserves array order and supports nested objects, adhering to common
 * bracket notation conventions.
 *
 * @example
 * ```ts
 * import { encode, decode } from "@rj/formdata";
 *
 * // Encoding a complex object
 * const data = {
 *   email: "john@doe.com",
 *   address: { city: "New York", zip: 10001 },
 *   tags: ["foo", "bar"],
 * };
 *
 * const formData = encode(data);
 * console.log([...formData.entries()]);
 * // [
 * //   ["email", "john@doe.com"],
 * //   ["address[city]", "New York"],
 * //   ["address[zip]", "10001"],
 * //   ["tags[0]", "foo"],
 * //   ["tags[1]", "bar"]
 * // ]
 *
 * // Decoding FormData
 * const decoded = decode(formData);
 * console.log(decoded);
 * // {
 * //   email: "john@doe.com",
 * //   address: { city: "New York", zip: "10001" },
 * //   tags: ["foo", "bar"],
 * // }
 * ```
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

type DecodeOptions = {
	emptyString?: "keep" | "set undefined" | "set null";
};

/**
 * Decodes a FormData instance into a complex nested object.
 *
 * @param {FormData} formData - The FormData instance to decode.
 * @param {"keep" | "set undefined" | "set null"} [options.emptyString="keep"] - Specifies how to handle empty string values:
 *   - `"keep"`: Retain the empty string as is (default behavior).
 *   - `"set undefined"`: Convert empty strings to `undefined`.
 *   - `"set null"`: Convert empty strings to `null`.
 * @returns {JSONValue} - A structured object representing the FormData.
 */
export function decode(
	formData: FormData,
	options: DecodeOptions = {},
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const { emptyString = "keep" } = options;

	const setNestedValue = (
		target: Record<string, unknown>,
		keys: string[],
		value: unknown,
	): void => {
		let current = target;

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const isLast = i === keys.length - 1;

			if (isLast) {
				// Handle empty string
				if (typeof value === "string" && value.trim() === "") {
					if (emptyString === "set null") {
						current[key] = null;
					} else if (emptyString === "set undefined") {
						// Skip assignment
					} else {
						current[key] = ""; // Default to "keep"
					}
				} else {
					current[key] = value;
				}
			} else {
				// Create nested structure if necessary
				if (!(key in current)) {
					current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
				}
				current = current[key] as Record<string, unknown>;
			}
		}
	};

	// Pre-split keys for better performance
	const keyCache = new Map<string, string[]>();
	const getKeys = (rawKey: string): string[] => {
		if (!keyCache.has(rawKey)) {
			keyCache.set(
				rawKey,
				rawKey.split(/[\[\]]+/).filter((key) => key),
			);
		}
		return keyCache.get(rawKey)!;
	};

	for (const [rawKey, value] of formData.entries()) {
		setNestedValue(result, getKeys(rawKey), value);
	}

	return result;
}
