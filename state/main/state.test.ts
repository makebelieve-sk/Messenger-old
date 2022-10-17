import mainReducer, { setFriendNotification } from "./slice";

describe("Main reducer", () => {
    test("Set null value to Main reducer", () => {
        expect(mainReducer({ friendNotification: 5 }, setFriendNotification(10))).toEqual({ friendNotification: 10 });
    });

    test("Checked the returnung value from action 'setFriendNotification'", () => {
        expect(setFriendNotification(22)).toEqual({ type: "main/setFriendNotification", payload: 22 });
    });
});