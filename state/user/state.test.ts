import { mockUser, mockUserDetail } from "../__mocks__";
import userReducer, { setUser, setUserDetail } from "./slice";

describe("User reducer", () => {
    test("Set null value to User reducer", () => {
        expect(userReducer({ user: mockUser, userDetail: mockUserDetail }, setUser(null))).toEqual({ user: null, userDetail: mockUserDetail });
    });

    test("Checked the returnung value from action 'setUser'", () => {
        expect(setUser(mockUser)).toEqual({ type: "user/setUser", payload: mockUser });
    });

    test("Checked the returnung value from action 'setUserDetail'", () => {
        expect(setUserDetail(mockUserDetail)).toEqual({ type: "user/setUserDetail", payload: mockUserDetail });
    });
});