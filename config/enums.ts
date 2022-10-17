enum TestMethods {
    mount = "mount",
    shallow = "shallow",
    render = "render"
};

enum ApiRoutes {
    //----auth----------
    signUp = "/sign-up",
    signIn = "/sign-in",
    logout = "/logout",
    //----userInfo------
    getUser = "/get-user",
    editMain = "/edit-main",
    editContacts = "/edit-contacts",
    getUserDetail = "/get-user-detail",
    //----file-----------
    uploadImage = "/upload-image",
    //----friends--------
    friends = "/friends",
    getFriends = "/get-friends",
    getFriendInfo = "/get-friend-info",
    getCountFriends = "/get-count-friends",
    getPossibleUsers = "/get-possible-users",
    addToFriend = "/add-to-friend",
    unsubscribeUser = "/unsubscribe-user",
    acceptUser = "/accept-user",
    leftInSubscribers = "/left-in-subscribers",
    deleteFriend = "/delete-friend",
    //----messages--------
    getDialogs = "/get-dialogs",
    getMessages = "/get-messages",
    saveMessage = "/save-message",
    readMessage = "/read-message",
    getChatId = "/get-chat-id",
};

enum HTTPStatuses {
    PermanentRedirect = 308,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    ServerError = 500,
};

enum Pages {
    profile = "/profile",
    messages = "/messages",
    friends = "/friends",
    signUp = "/sign-up",
    signIn = "/sign-in",
    error = "/error",
    settings = "/settings",
    help = "/help",
    edit = "/edit",
};

enum FriendsTab {
    all = 0,
    online = 1,
    subscribers = 2,
    friendRequests = 3,
    incomingRequests = 4,
    search = 5,
};

enum SocketActions {
    GET_ALL_USERS = "GET_ALL_USERS",
    GET_NEW_USER = "GET_NEW_USER",
    ADD_TO_FRIENDS = "ADD_TO_FRIENDS",
    UNSUBSCRIBE = "UNSUBSCRIBE",
    FRIENDS = "FRIENDS",
    MESSAGE = "MESSAGE",
    SEND_MESSAGE = "SEND_MESSAGE",
    SET_TEMP_CHAT_ID = "SET_TEMP_CHAT_ID",
};

enum MessageTypes {
    MESSAGE = 1,
    WITH_FILE = 2,
    WITH_VOICE = 3,
};

enum MessageReadStatus {
    NOT_READ = 0,
    READ = 1
};

enum Times {
    TODAY = 1000 * 60 * 60 * 24,
    YESTERDAY = 1000 * 60 * 60 * 24 * 2,
    HALF_YEAR = 1000 * 60 * 60 * 24 * 30 * 6,
    YEAR_OR_OLDER = 1000 * 60 * 60 * 24 * 2 * 30,
};

enum RedisChannel {
    TEMP_CHAT_ID = "TEMP_CHAT_ID"
};

export {
    TestMethods,
    ApiRoutes,
    HTTPStatuses,
    Pages,
    FriendsTab,
    SocketActions,
    MessageTypes,
    MessageReadStatus,
    Times,
    RedisChannel,
};