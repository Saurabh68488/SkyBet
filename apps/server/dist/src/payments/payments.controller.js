"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPaymentsController = exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async createDeposit(body, req) {
        return this.paymentsService.createDeposit(req.user.id, body.amount, body.playerTxnId);
    }
    async createWithdraw(body, req) {
        return this.paymentsService.createWithdraw(req.user.id, body.amount, body.upiId);
    }
    async getMyRequests(req, page, type) {
        return this.paymentsService.getMyRequests(req.user.id, page ? parseInt(page) : 1, type || undefined);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('deposit'),
    (0, swagger_1.ApiOperation)({ summary: 'Request deposit (add money)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createDeposit", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    (0, swagger_1.ApiOperation)({ summary: 'Request withdrawal' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createWithdraw", null);
__decorate([
    (0, common_1.Get)('my-requests'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my payment requests' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getMyRequests", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
let AdminPaymentsController = class AdminPaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async getAllRequests(page, status, type) {
        return this.paymentsService.getAllRequests(page ? parseInt(page) : 1, status || undefined, type || undefined);
    }
    async getStats() {
        return this.paymentsService.getStats();
    }
    async approveRequest(id, body, req) {
        return this.paymentsService.approveRequest(id, req.user.id, body.adminTxnId);
    }
    async rejectRequest(id, body, req) {
        return this.paymentsService.rejectRequest(id, req.user.id, body.reason);
    }
};
exports.AdminPaymentsController = AdminPaymentsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payment requests' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminPaymentsController.prototype, "getAllRequests", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPaymentsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Put)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a payment request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminPaymentsController.prototype, "approveRequest", null);
__decorate([
    (0, common_1.Put)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a payment request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminPaymentsController.prototype, "rejectRequest", null);
exports.AdminPaymentsController = AdminPaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin/payments'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.AdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], AdminPaymentsController);
//# sourceMappingURL=payments.controller.js.map