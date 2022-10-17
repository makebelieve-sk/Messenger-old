import { mockUser } from "../__mocks__";
import friendsReducer, { setFriends, setPossibleUsers } from "./slice";

describe("Freinds reducer", () => {
    test("Set null value 'friends' to Friends reducer", () => {
        expect(friendsReducer({ friends: [mockUser], possibleUsers: [mockUser] }, setFriends(null))).toEqual({ friends: null, possibleUsers: [mockUser] });
    });

    test("Change values in Friends reducer", () => {
        expect(friendsReducer({ friends: new Array(2).fill(mockUser), possibleUsers: [mockUser] }, setPossibleUsers(new Array(3).fill(mockUser))))
            .toEqual({ friends: new Array(2).fill(mockUser), possibleUsers: new Array(3).fill(mockUser) });
    });

    test("Checked the returnung value from action 'setFriends'", () => {
        expect(setFriends(new Array(4).fill(mockUser))).toEqual({ type: "friends/setFriends", payload: new Array(4).fill(mockUser) });
    });

    test("Checked the returnung value from action 'setPossibleUsers'", () => {
        expect(setPossibleUsers(new Array(2).fill(mockUser))).toEqual({ type: "friends/setPossibleUsers", payload: new Array(2).fill(mockUser) });
    });
});