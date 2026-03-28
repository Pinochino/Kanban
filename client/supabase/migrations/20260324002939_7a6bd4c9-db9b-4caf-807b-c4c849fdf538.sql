
-- Fix overly permissive policies

-- Drop permissive ALL policies
DROP POLICY IF EXISTS "Board members can manage card labels" ON public.card_labels;
DROP POLICY IF EXISTS "Authenticated can manage checklists" ON public.checklists;
DROP POLICY IF EXISTS "Authenticated can manage checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated can manage attachments" ON public.attachments;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

-- Card labels: only board members with write access
CREATE POLICY "Board members can insert card labels" ON public.card_labels FOR INSERT TO authenticated
  WITH CHECK (
    card_id IN (
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );
CREATE POLICY "Board members can delete card labels" ON public.card_labels FOR DELETE TO authenticated
  USING (
    card_id IN (
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );

-- Checklists: board members only
DROP POLICY IF EXISTS "Authenticated can view checklists" ON public.checklists;
CREATE POLICY "Board members can view checklists" ON public.checklists FOR SELECT TO authenticated
  USING (
    card_id IN (
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Board members can insert checklists" ON public.checklists FOR INSERT TO authenticated
  WITH CHECK (
    card_id IN (
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );
CREATE POLICY "Board members can update checklists" ON public.checklists FOR UPDATE TO authenticated
  USING (
    card_id IN (
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );
CREATE POLICY "Board members can delete checklists" ON public.checklists FOR DELETE TO authenticated
  USING (
    card_id IN (
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );

-- Checklist items: same as checklists
DROP POLICY IF EXISTS "Authenticated can view checklist items" ON public.checklist_items;
CREATE POLICY "Board members can view checklist items" ON public.checklist_items FOR SELECT TO authenticated
  USING (
    checklist_id IN (
      SELECT cl.id FROM public.checklists cl
      JOIN public.cards c ON c.id = cl.card_id
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT cl.id FROM public.checklists cl
      JOIN public.cards c ON c.id = cl.card_id
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Board members can insert checklist items" ON public.checklist_items FOR INSERT TO authenticated
  WITH CHECK (
    checklist_id IN (
      SELECT cl.id FROM public.checklists cl
      JOIN public.cards c ON c.id = cl.card_id
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT cl.id FROM public.checklists cl
      JOIN public.cards c ON c.id = cl.card_id
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );
CREATE POLICY "Board members can update checklist items" ON public.checklist_items FOR UPDATE TO authenticated
  USING (
    checklist_id IN (
      SELECT cl.id FROM public.checklists cl
      JOIN public.cards c ON c.id = cl.card_id
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT cl.id FROM public.checklists cl
      JOIN public.cards c ON c.id = cl.card_id
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );
CREATE POLICY "Board members can delete checklist items" ON public.checklist_items FOR DELETE TO authenticated
  USING (
    checklist_id IN (
      SELECT cl.id FROM public.checklists cl
      JOIN public.cards c ON c.id = cl.card_id
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT cl.id FROM public.checklists cl
      JOIN public.cards c ON c.id = cl.card_id
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid() AND bm.role IN ('owner', 'member')
    )
  );

-- Attachments: board members only
DROP POLICY IF EXISTS "Authenticated can view attachments" ON public.attachments;
CREATE POLICY "Board members can view attachments" ON public.attachments FOR SELECT TO authenticated
  USING (
    card_id IN (
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.boards b ON b.id = l.board_id
      WHERE b.owner_id = auth.uid()
      UNION
      SELECT c.id FROM public.cards c
      JOIN public.lists l ON l.id = c.list_id
      JOIN public.board_members bm ON bm.board_id = l.board_id
      WHERE bm.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Board members can insert attachments" ON public.attachments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Board members can delete attachments" ON public.attachments FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Notification logs: restrict inserts
CREATE POLICY "Admins can insert notifications" ON public.notification_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Activity logs: restrict inserts to authenticated users with proper user_id
CREATE POLICY "Authenticated can insert own activity" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
