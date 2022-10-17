import { setError } from "./slice";
import errorReducer from "./slice";

const error = "some error";

describe("Error reducer", () => {
    test("Set null value to Error reducer", () => {
        expect(errorReducer({ error: "some error" }, setError(null))).toEqual({ error: null });
    });

    test("Set value to Error reducer", () => {
        expect(errorReducer({ error: null }, setError(error))).toEqual({ error });
    });

    test("Checked the returnung value from action 'setError'", () => {
        expect(setError(error)).toEqual({ type: "error/setError", payload: error });
    });
});