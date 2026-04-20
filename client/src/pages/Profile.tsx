import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAppDispatch } from "@/store/hooks";
import { setCurrentUser } from "@/store/slice/AuthSlice";
import { IUser } from "@/types/UserInterface";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const getInitials = (name?: string) => {
  const value = (name ?? "").trim();

  if (!value) {
    return "U";
  }

  const parts = value.split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const normalizeError = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
};

export default function Profile() {
  const dispatch = useAppDispatch();
  const { user } = useCurrentUser();

  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setAvatarPreview(user?.avatarUrl ?? null);
  }, [user?.username, user?.email, user?.avatarUrl]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const hasChanges = useMemo(() => {
    if (!user) {
      return false;
    }

    return (
      username.trim() !== String(user.username ?? "").trim() ||
      email.trim() !== String(user.email ?? "").trim() ||
      password.trim().length > 0 ||
      Boolean(selectedAvatarFile)
    );
  }, [email, password, selectedAvatarFile, user, username]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("Không tìm thấy tài khoản hiện tại.");
      }

      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("email", email.trim());

      if (password.trim()) {
        formData.append("password", password.trim());
      }

      if (selectedAvatarFile) {
        formData.append("avatar", selectedAvatarFile);
      }

      const response = await handleApi({
        url: `${apiName.accounts.updateProfile}/${user.id}`,
        method: "PATCH",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      return response.data?.data as IUser;
    },
    onSuccess: (updatedUser) => {
      dispatch(setCurrentUser(updatedUser));
      setSelectedAvatarFile(null);
      setPassword("");
      toast.success("Đã cập nhật thông tin cá nhân.");
    },
    onError: (error) => {
      toast.error(normalizeError(error, "Cập nhật hồ sơ thất bại."));
    },
  });

  const handleAvatarSelect = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.");
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setSelectedAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleAvatarSelect(event.target.files?.[0] ?? null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      toast.error("Không tìm thấy tài khoản hiện tại.");
      return;
    }

    if (!username.trim()) {
      toast.error("Username không được để trống.");
      return;
    }

    if (!email.trim()) {
      toast.error("Email không được để trống.");
      return;
    }

    if (!hasChanges) {
      toast.message("Không có thay đổi để lưu.");
      return;
    }

    await updateProfileMutation.mutateAsync();
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Card className="border-0 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 text-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription className="text-cyan-100">
            Cập nhật thông tin cá nhân, mật khẩu và ảnh đại diện của bạn.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>
            Những thay đổi ở đây sẽ cập nhật cho tài khoản hiện tại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 rounded-lg border border-dashed p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage src={avatarPreview || user?.avatarUrl || ""} alt={user?.username || "User"} />
                  <AvatarFallback className="text-lg">{getInitials(username || user?.username)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Ảnh đại diện</p>
                  <p className="text-sm text-muted-foreground">JPG, PNG, WEBP - tối đa 5MB.</p>
                </div>
              </div>

              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Chọn ảnh
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nhập username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Nhập email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-password">Mật khẩu mới (không bắt buộc)</Label>
              <Input
                id="profile-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Để trống nếu không đổi mật khẩu"
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfileMutation.isPending || !hasChanges}>
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
