"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityType = exports.VisitRequestStatus = exports.PropertyStatus = exports.OperationType = exports.PropertyType = void 0;
var PropertyType;
(function (PropertyType) {
    PropertyType["HOUSE"] = "HOUSE";
    PropertyType["APARTMENT"] = "APARTMENT";
    PropertyType["LAND"] = "LAND";
    PropertyType["COMMERCIAL"] = "COMMERCIAL";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
var OperationType;
(function (OperationType) {
    OperationType["SALE"] = "SALE";
    OperationType["RENT"] = "RENT";
})(OperationType || (exports.OperationType = OperationType = {}));
var PropertyStatus;
(function (PropertyStatus) {
    PropertyStatus["DRAFT"] = "DRAFT";
    PropertyStatus["PUBLISHED"] = "PUBLISHED";
    PropertyStatus["RESERVED"] = "RESERVED";
    PropertyStatus["PAUSED"] = "PAUSED";
    PropertyStatus["SOLD"] = "SOLD";
    PropertyStatus["RENTED"] = "RENTED";
    PropertyStatus["CANCELLED"] = "CANCELLED";
})(PropertyStatus || (exports.PropertyStatus = PropertyStatus = {}));
var VisitRequestStatus;
(function (VisitRequestStatus) {
    VisitRequestStatus["PENDING"] = "PENDING";
    VisitRequestStatus["CONFIRMED"] = "CONFIRMED";
    VisitRequestStatus["COMPLETED"] = "COMPLETED";
    VisitRequestStatus["CANCELLED"] = "CANCELLED";
    VisitRequestStatus["REJECTED"] = "REJECTED";
})(VisitRequestStatus || (exports.VisitRequestStatus = VisitRequestStatus = {}));
var ActivityType;
(function (ActivityType) {
    ActivityType["COMMENT"] = "COMMENT";
    ActivityType["VISIT_REQUEST"] = "VISIT_REQUEST";
    ActivityType["PROPERTY_STATUS_CHANGE"] = "PROPERTY_STATUS_CHANGE";
    ActivityType["REVIEW"] = "REVIEW";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
//# sourceMappingURL=enum.js.map