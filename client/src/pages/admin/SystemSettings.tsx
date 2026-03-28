import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function SystemSettings() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("system_settings").select("*");
      return data || [];
    },
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setValues(map);
    }
  }, [settings]);

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from("system_settings").update({ value }).eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Đã lưu cài đặt!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSaveAll = () => {
    Object.entries(values).forEach(([key, value]) => {
      saveSetting.mutate({ key, value });
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cài đặt hệ thống</h2>
        <Button onClick={handleSaveAll}><Save className="h-4 w-4 mr-2" />Lưu tất cả</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Giới hạn</CardTitle>
            <CardDescription>Cấu hình giới hạn cho người dùng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Số board tối đa / người dùng</Label>
              <Input type="number" value={values.max_boards_per_user || ""} onChange={(e) => setValues({ ...values, max_boards_per_user: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Số thành viên tối đa / board</Label>
              <Input type="number" value={values.max_members_per_board || ""} onChange={(e) => setValues({ ...values, max_members_per_board: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Dung lượng file tối đa (MB)</Label>
              <Input type="number" value={values.max_file_size_mb || ""} onChange={(e) => setValues({ ...values, max_file_size_mb: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tính năng</CardTitle>
            <CardDescription>Bật/tắt các tính năng hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Bình luận</Label>
                <p className="text-sm text-muted-foreground">Cho phép bình luận trên cards</p>
              </div>
              <Switch
                checked={values.comments_enabled === "true"}
                onCheckedChange={(checked) => setValues({ ...values, comments_enabled: String(checked) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Upload file</Label>
                <p className="text-sm text-muted-foreground">Cho phép đính kèm file</p>
              </div>
              <Switch
                checked={values.file_upload_enabled === "true"}
                onCheckedChange={(checked) => setValues({ ...values, file_upload_enabled: String(checked) })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
