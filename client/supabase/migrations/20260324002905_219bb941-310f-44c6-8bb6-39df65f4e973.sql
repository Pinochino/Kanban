
-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'guest');
CREATE TYPE public.report_status AS ENUM ('pending', 'resolved', 'dismissed');
CREATE TYPE public.report_target_type AS ENUM ('card', 'comment', 'user');
CREATE TYPE public.notification_status AS ENUM ('sent', 'failed', 'pending');
CREATE TYPE public.board_member_role AS ENUM ('owner', 'member', 'viewer');

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES TABLE (separate for security)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION for role checking
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============================================
-- BOARDS TABLE
-- =============================================
CREATE TABLE public.boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  background_color TEXT DEFAULT '#1e40af',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- =============================================
-- BOARD MEMBERS TABLE
-- =============================================
CREATE TABLE public.board_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role board_member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (board_id, user_id)
);

ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- LISTS TABLE
-- =============================================
CREATE TABLE public.lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CARDS TABLE
-- =============================================
CREATE TABLE public.cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  position INTEGER NOT NULL DEFAULT 0,
  cover_color TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- =============================================
-- LABELS TABLE
-- =============================================
CREATE TABLE public.labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CARD LABELS (junction)
-- =============================================
CREATE TABLE public.card_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (card_id, label_id)
);

ALTER TABLE public.card_labels ENABLE ROW LEVEL SECURITY;

-- =============================================
-- COMMENTS TABLE
-- =============================================
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CHECKLISTS TABLE
-- =============================================
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Checklist',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CHECKLIST ITEMS TABLE
-- =============================================
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- REPORTS TABLE (moderation)
-- =============================================
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type report_target_type NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SYSTEM SETTINGS TABLE
-- =============================================
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- NOTIFICATION LOGS TABLE
-- =============================================
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  status notification_status NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ACTIVITY LOGS TABLE
-- =============================================
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ATTACHMENTS TABLE
-- =============================================
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: users see all profiles, update own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles: only admins manage, users read own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Boards: members can see, owner/admin manage
CREATE POLICY "Users can view their boards" ON public.boards FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Users can create boards" ON public.boards FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update boards" ON public.boards FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete boards" ON public.boards FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Board members
CREATE POLICY "Board members can view members" ON public.board_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Board owners can manage members" ON public.board_members FOR INSERT TO authenticated
  WITH CHECK (
    board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Board owners can update members" ON public.board_members FOR UPDATE TO authenticated
  USING (
    board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Board owners can remove members" ON public.board_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Lists: board members can access
CREATE POLICY "Board members can view lists" ON public.lists FOR SELECT TO authenticated
  USING (
    board_id IN (
      SELECT id FROM public.boards WHERE owner_id = auth.uid()
      UNION
      SELECT board_id FROM public.board_members WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Board members can create lists" ON public.lists FOR INSERT TO authenticated
  WITH CHECK (
    board_id IN (
      SELECT id FROM public.boards WHERE owner_id = auth.uid()
      UNION
      SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND role IN ('owner', 'member')
    )
  );
CREATE POLICY "Board members can update lists" ON public.lists FOR UPDATE TO authenticated
  USING (
    board_id IN (
      SELECT id FROM public.boards WHERE owner_id = auth.uid()
      UNION
      SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND role IN ('owner', 'member')
    )
  );
CREATE POLICY "Board members can delete lists" ON public.lists FOR DELETE TO authenticated
  USING (
    board_id IN (
      SELECT id FROM public.boards WHERE owner_id = auth.uid()
      UNION
      SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND role IN ('owner', 'member')
    )
  );

-- Cards: same logic as lists
CREATE POLICY "Board members can view cards" ON public.cards FOR SELECT TO authenticated
  USING (
    list_id IN (
      SELECT l.id FROM public.lists l
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT l.id FROM public.lists l
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Board members can create cards" ON public.cards FOR INSERT TO authenticated
  WITH CHECK (
    list_id IN (
      SELECT l.id FROM public.lists l
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT l.id FROM public.lists l
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );
CREATE POLICY "Board members can update cards" ON public.cards FOR UPDATE TO authenticated
  USING (
    list_id IN (
      SELECT l.id FROM public.lists l
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT l.id FROM public.lists l
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );
CREATE POLICY "Board members can delete cards" ON public.cards FOR DELETE TO authenticated
  USING (
    list_id IN (
      SELECT l.id FROM public.lists l
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT l.id FROM public.lists l
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );

-- Labels
CREATE POLICY "Board members can view labels" ON public.labels FOR SELECT TO authenticated
  USING (
    board_id IN (
      SELECT id FROM public.boards WHERE owner_id = auth.uid()
      UNION
      SELECT board_id FROM public.board_members WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Board members can manage labels" ON public.labels FOR ALL TO authenticated
  USING (
    board_id IN (
      SELECT id FROM public.boards WHERE owner_id = auth.uid()
      UNION
      SELECT board_id FROM public.board_members WHERE user_id = auth.uid() AND role IN ('owner', 'member')
    )
  );

-- Card labels
CREATE POLICY "Board members can view card labels" ON public.card_labels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Board members can manage card labels" ON public.card_labels FOR ALL TO authenticated USING (true);

-- Comments
CREATE POLICY "Board members can view non-hidden comments" ON public.comments FOR SELECT TO authenticated
  USING (is_hidden = false OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Checklists & items
CREATE POLICY "Authenticated can view checklists" ON public.checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage checklists" ON public.checklists FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated can view checklist items" ON public.checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage checklist items" ON public.checklist_items FOR ALL TO authenticated USING (true);

-- Reports
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- System settings: only admins
CREATE POLICY "Admins can view settings" ON public.system_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Notification logs
CREATE POLICY "Users can view own notifications" ON public.notification_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own notifications" ON public.notification_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert notifications" ON public.notification_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Activity logs: admins only
CREATE POLICY "Admins can view activity logs" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert activity logs" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Attachments
CREATE POLICY "Authenticated can view attachments" ON public.attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage attachments" ON public.attachments FOR ALL TO authenticated USING (true);

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Assign default 'member' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: Update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- DEFAULT SYSTEM SETTINGS
-- =============================================
INSERT INTO public.system_settings (key, value, description) VALUES
  ('max_boards_per_user', '10', 'Maximum boards a user can create'),
  ('max_members_per_board', '20', 'Maximum members per board'),
  ('comments_enabled', 'true', 'Enable/disable comments globally'),
  ('file_upload_enabled', 'true', 'Enable/disable file uploads'),
  ('max_file_size_mb', '10', 'Maximum file size in MB');
