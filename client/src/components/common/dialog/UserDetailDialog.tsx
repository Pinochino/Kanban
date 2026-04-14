import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { IUser } from "@/types/UserInterface";
import React from "react";

const UserDetailDialog = ({
    detailUser,
    getRoleLabel,
    detailUserId,
    setDetailUserId,
    detailLoading
}: {
    detailUser: IUser;
    getRoleLabel: (name?: string | null) => React.ReactElement;
    detailUserId: string | null;
    setDetailUserId: (userId: string) => string;
    detailLoading: boolean;
}) => {
    return (
        <Dialog
            open={Boolean(detailUserId)}
            onOpenChange={(open) => !open && setDetailUserId(null)}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chi tiết người dùng</DialogTitle>
                    <DialogDescription>
                        Thông tin tài khoản và trạng thái hiện tại.
                    </DialogDescription>
                </DialogHeader>

                {detailLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải chi tiết...</p>
                ) : detailUser ? (
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">ID</span>
                            <span className="font-medium">{detailUser.id}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">Username</span>
                            <span className="font-medium">
                                {detailUser.username || "Chưa cập nhật"}
                            </span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium">
                                {detailUser.email || "Chưa cập nhật"}
                            </span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">Vai trò</span>
                            <div className="flex flex-wrap gap-1.5">
                                {detailUser.roles?.map((role) => (
                                    <Badge key={role.id}>{getRoleLabel(role.name)}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">Trạng thái</span>
                            <Badge variant={detailUser.login ? "outline" : "destructive"}>
                                {detailUser.login ? "Đang hoạt động" : "Không hoạt động"}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-muted-foreground">Xóa mềm</span>
                            <Badge variant={detailUser.active ? "outline" : "secondary"}>
                                {detailUser.active ? "Không" : "Đã xóa mềm"}
                            </Badge>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Không lấy được dữ liệu chi tiết.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default UserDetailDialog;
