import { assertEquals } from "@std/assert";
import { encode, decode } from "./mod.ts";

Deno.test("encode() handles simple data", () => {
	const data = { email: "john@doe.com", password: "johndoe123" };
	const actual = encode(data);
	const expected = new FormData();
	expected.append("email", "john@doe.com");
	expected.append("password", "johndoe123");
	assertEquals(actual, expected);
});

Deno.test("encode() omits null and undefined values", () => {
	const data = { email: null, password: undefined };
	const actual = encode(data);
	assertEquals(actual, new FormData());
});

Deno.test("encode() handles primitives as strings", () => {
	const actual = encode({ amount: 10 });
	const expected = new FormData();
	expected.append("amount", "10");
	assertEquals(actual, expected);
});

Deno.test("encode() handles arrays", () => {
	const data = { tags: ["foo", "bar"] };
	const actual = encode(data);
	const expected = new FormData();
	expected.append("tags[0]", "foo");
	expected.append("tags[1]", "bar");
	assertEquals(actual, expected);
});

Deno.test("encode() handles complex data", () => {
	const data = { address: { street: "john doe st.", tags: ["foo", "bar"] } };
	const actual = encode(data);
	const expected = new FormData();
	expected.append("address[street]", "john doe st.");
	expected.append("address[tags][0]", "foo");
	expected.append("address[tags][1]", "bar");
	assertEquals(actual, expected);
});

Deno.test("decode() handles simple FormData", () => {
	const formData = new FormData();
	formData.append("email", "john@doe.com");
	formData.append("password", "johndoe123");

	const actual = decode(formData);
	const expected = { email: "john@doe.com", password: "johndoe123" };
	assertEquals(actual, expected);
});

Deno.test("decode() handles primitive values", () => {
	const formData = new FormData();
	formData.append("amount", "10");

	const actual = decode(formData);
	const expected = { amount: "10" };
	assertEquals(actual, expected);
});

Deno.test("decode() handles arrays", () => {
	const formData = new FormData();
	formData.append("tags[0]", "foo");
	formData.append("tags[1]", "bar");

	const actual = decode(formData);
	const expected = { tags: ["foo", "bar"] };
	assertEquals(actual, expected);
});

Deno.test("decode() handles complex nested data", () => {
	const formData = new FormData();
	formData.append("address[street]", "john doe st.");
	formData.append("address[tags][0]", "foo");
	formData.append("address[tags][1]", "bar");

	const actual = decode(formData);
	const expected = {
		address: { street: "john doe st.", tags: ["foo", "bar"] },
	};
	assertEquals(actual, expected);
});

Deno.test("decode() handles nested objects inside arrays", () => {
	const formData = new FormData();
	formData.append("users[0][name]", "john doe");
	formData.append("users[1][name]", "jane doe");
	formData.append("users[0][tags][0]", "foo");

	const actual = decode(formData);
	const expected = {
		users: [{ name: "john doe", tags: ["foo"] }, { name: "jane doe" }],
	};
	assertEquals(actual, expected);
});
