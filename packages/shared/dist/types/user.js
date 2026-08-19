"use strict";
// ============================================
// User Types
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["PLAYER"] = "PLAYER";
})(Role || (exports.Role = Role = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
