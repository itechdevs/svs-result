"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  ListChecks,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  useObservationCategories,
  useCreateObservationCategory,
  useUpdateObservationCategory,
  useDeleteObservationCategory,
  useCreateObservationItem,
  useUpdateObservationItem,
  useDeleteObservationItem,
  type ObservationCategory,
  type ObservationItem,
} from "@/hooks/use-observations";

// ─── Draft item type (used inside dialogs before saving) ─────────────────────

interface DraftItem {
  /** Temporary local key — never sent to the server */
  key: string;
  description: string;
  choices: string[];
}

function makeDraft(description = "", choices: string[] = []): DraftItem {
  return { key: crypto.randomUUID(), description, choices };
}

// ─── Choices Editor (inline option editor for observation items) ──────────────

function ChoicesEditor({
  choices,
  onChange,
}: {
  choices: string[];
  onChange: (choices: string[]) => void;
}) {
  const addChoice = () => onChange([...choices, ""]);
  const updateChoice = (idx: number, val: string) =>
    onChange(choices.map((c, i) => (i === idx ? val : c)));
  const removeChoice = (idx: number) =>
    onChange(choices.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {choices.map((choice, idx) => (
        <div key={idx} className="flex items-center gap-1 bg-muted/40 rounded-md px-2 py-0.5">
          <input
            value={choice}
            onChange={(e) => updateChoice(idx, e.target.value)}
            className="w-20 bg-transparent text-[11px] outline-none border-none"
            placeholder="Option..."
          />
          <button
            onClick={() => removeChoice(idx)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
      <button
        onClick={addChoice}
        className="text-[11px] text-primary hover:underline"
      >
        + Add option
      </button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ObservationsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Saved ItemRow (on the category card — edit/delete existing items) ────────

interface ItemRowProps {
  item: ObservationItem;
}

function ItemRow({ item }: ItemRowProps) {
  const updateItem = useUpdateObservationItem();
  const deleteItem = useDeleteObservationItem();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.description);
  const [choicesDraft, setChoicesDraft] = useState<string[]>(item.choices ?? []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || (trimmed === item.description && JSON.stringify(choicesDraft) === JSON.stringify(item.choices ?? []))) {
      setDraft(item.description);
      setChoicesDraft(item.choices ?? []);
      setEditing(false);
      return;
    }
    try {
      await updateItem.mutateAsync({ id: item.id, data: { description: trimmed, choices: choicesDraft.length > 0 ? choicesDraft : [] } });
      setEditing(false);
      toast.success("Observation updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update observation");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Observation deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete observation");
    }
  };

  const addChoice = () => setChoicesDraft((prev) => [...prev, ""]);
  const updateChoice = (idx: number, val: string) => setChoicesDraft((prev) => prev.map((c, i) => (i === idx ? val : c)));
  const removeChoice = (idx: number) => setChoicesDraft((prev) => prev.filter((_, i) => i !== idx));

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-8 text-sm flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") { setDraft(item.description); setEditing(false); }
            }}
            onBlur={commitEdit}
            disabled={updateItem.isPending}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 px-9">
          {choicesDraft.map((choice, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
              <input
                value={choice}
                onChange={(e) => updateChoice(idx, e.target.value)}
                className="w-20 bg-transparent text-[11px] outline-none border-none"
                placeholder="Option..."
              />
              <button onClick={() => removeChoice(idx)} className="text-muted-foreground hover:text-destructive">
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <button onClick={addChoice} className="text-[11px] text-primary hover:underline">+ Add option</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
      <span className="flex-1 text-sm text-foreground/85 leading-snug">
        {item.description}
      </span>
      {item.choices && item.choices.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground">[ {item.choices.join(" | ")} ]</span>
        </div>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title="Edit"
          onClick={() => { setDraft(item.description); setChoicesDraft(item.choices ?? []); setEditing(true); }}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this observation?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{item.description}&rdquo; will be permanently deleted.
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}


// ─── CreateCategoryDialog ─────────────────────────────────────────────────────
// Title field at top, then a dynamic list of observation description inputs.
// Dialog body is scrollable; header and footer are sticky.

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function CreateCategoryDialog({ open, onOpenChange }: CreateCategoryDialogProps) {
  const queryClient = useQueryClient();
  const createCategory = useCreateObservationCategory();

  const [title, setTitle] = useState("");
  const [drafts, setDrafts] = useState<DraftItem[]>([makeDraft()]);
  const lastInputRef = useRef<HTMLInputElement>(null);

  // Reset form whenever dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setDrafts([makeDraft()]);
    }
  }, [open]);

  const addDraft = () => {
    setDrafts((prev) => [...prev, makeDraft()]);
    // focus happens via the ref after render
    setTimeout(() => lastInputRef.current?.focus(), 0);
  };

  const removeDraft = (key: string) => {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.key !== key);
      // Always keep at least one row
      return next.length === 0 ? [makeDraft()] : next;
    });
  };

  const validDrafts = drafts.filter((d) => d.description.trim() !== "");
  const isPending = createCategory.isPending;

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    try {
      // 1. Create the category
      const category = await createCategory.mutateAsync({ title: trimmedTitle });

      // 2. Create all non-empty items in parallel via fetch
      if (validDrafts.length > 0) {
        await Promise.all(
          validDrafts.map((d, idx) =>
            fetch(`/api/admin/observations/categories/${category.id}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description: d.description.trim(),
                displayOrder: idx,
                choices: d.choices.length > 0 ? d.choices : undefined,
              }),
            })
          )
        );
        // Invalidate so the list re-fetches with the new items
        await queryClient.invalidateQueries({ queryKey: ["observation-categories"] });
      }

      onOpenChange(false);
      toast.success("Category created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Override DialogContent layout so we can have a sticky header,
        scrollable middle, and sticky footer.
        max-h-[90vh] keeps it inside the viewport on small screens.
      */}
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 flex flex-col max-h-[90vh]">
        {/* Sticky header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle>Add Observation Category</DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Category title */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
              Category Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Attention, Discipline, Participation"
              className="w-full text-sm"
              autoFocus
            />
          </div>

          <Separator />

          {/* Observation items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Observations
              </label>
              <span className="text-[11px] text-muted-foreground">
                {validDrafts.length} item{validDrafts.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2">
              {drafts.map((draft, idx) => (
                <div key={draft.key} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <Input
                      ref={idx === drafts.length - 1 ? lastInputRef : undefined}
                      value={draft.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDrafts((prev) =>
                          prev.map((d) => (d.key === draft.key ? { ...d, description: val } : d))
                        );
                      }}
                      placeholder="e.g. Pays attention and follows instructions"
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addDraft();
                        }
                      }}
                    />
                    <ChoicesEditor
                      choices={draft.choices}
                      onChange={(newChoices) => {
                        setDrafts((prev) =>
                          prev.map((d) => (d.key === draft.key ? { ...d, choices: newChoices } : d))
                        );
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0 self-start mt-0.5"
                    onClick={() => removeDraft(draft.key)}
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/5 px-2"
              onClick={addDraft}
            >
              <Plus className="w-3.5 h-3.5" />
              Add observation
            </Button>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
            className="bg-primary text-primary-foreground text-xs font-bold"
          >
            {isPending ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// ─── EditCategoryDialog ───────────────────────────────────────────────────────
// Shows the category title (editable) + all existing saved items (inline
// edit/delete) + a draft section to add more items — all in one scrollable dialog.

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: ObservationCategory;
}

function EditCategoryDialog({ open, onOpenChange, category }: EditCategoryDialogProps) {
  const queryClient = useQueryClient();
  const updateCategory = useUpdateObservationCategory();
  const createItem = useCreateObservationItem(category.id);
  const updateItem = useUpdateObservationItem();
  const deleteItem = useDeleteObservationItem();

  const savedItems: ObservationItem[] = category.items ?? [];

  // Title field state
  const [title, setTitle] = useState(category.title);

  // Inline-edit state for each saved item: itemId → draft string
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editChoices, setEditChoices] = useState<string[]>([]);
  const editInputRef = useRef<HTMLInputElement>(null);

  // New drafts to append
  const [newDrafts, setNewDrafts] = useState<DraftItem[]>([]);
  const lastNewRef = useRef<HTMLInputElement>(null);

  // Sync state when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(category.title);
      setEditingId(null);
      setEditDraft("");
      setEditChoices([]);
      setNewDrafts([]);
    }
  }, [open, category.title]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  // ── Saved-item helpers ─────────────────────────────────────────────────────

  const startEdit = (item: ObservationItem) => {
    setEditingId(item.id);
    setEditDraft(item.description);
    setEditChoices(item.choices ?? []);
  };

  const commitEdit = async (item: ObservationItem) => {
    const trimmed = editDraft.trim();
    setEditingId(null);
    if (!trimmed || (trimmed === item.description && JSON.stringify(editChoices) === JSON.stringify(item.choices ?? []))) return;
    try {
      await updateItem.mutateAsync({ id: item.id, data: { description: trimmed, choices: editChoices.length > 0 ? editChoices : [] } });
      toast.success("Observation updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update observation");
    }
  };

  const handleDeleteSaved = async (item: ObservationItem) => {
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Observation deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete observation");
    }
  };

  // ── New-draft helpers ──────────────────────────────────────────────────────

  const addNewDraft = () => {
    setNewDrafts((prev) => [...prev, makeDraft()]);
    setTimeout(() => lastNewRef.current?.focus(), 0);
  };

  const removeNewDraft = (key: string) => {
    setNewDrafts((prev) => prev.filter((d) => d.key !== key));
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const validNewDrafts = newDrafts.filter((d) => d.description.trim() !== "");
  const titleChanged = title.trim() !== category.title;
  const hasNewItems = validNewDrafts.length > 0;
  const canSave = (titleChanged || hasNewItems) && title.trim() !== "";
  const isSaving = updateCategory.isPending || createItem.isPending;

  const handleSave = async () => {
    try {
      // Update title if changed
      if (titleChanged) {
        await updateCategory.mutateAsync({
          id: category.id,
          data: { title: title.trim() },
        });
      }
      // Add new items via fetch then invalidate so the card re-renders
      if (hasNewItems) {
        const base = savedItems.length;
        await Promise.all(
          validNewDrafts.map((d, idx) =>
            fetch(`/api/admin/observations/categories/${category.id}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description: d.description.trim(),
                displayOrder: base + idx,
                choices: d.choices.length > 0 ? d.choices : undefined,
              }),
            })
          )
        );
        await queryClient.invalidateQueries({ queryKey: ["observation-categories"] });
      }
      onOpenChange(false);
      toast.success("Category saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 flex flex-col max-h-[90vh]">
        {/* Sticky header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Category title */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
              Category Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Attention, Discipline, Participation"
              className="w-full text-sm"
              autoFocus
            />
          </div>

          <Separator />

          {/* Existing saved items */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">
              Observations
            </label>

            {savedItems.length === 0 && newDrafts.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-2">
                No observations yet. Add some below.
              </p>
            ) : (
              <div className="space-y-1.5">
                {/* Saved items */}
                {savedItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {idx + 1}
                      </span>
                    </div>

                    {editingId === item.id ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <Input
                          ref={editInputRef}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          className="text-sm h-8"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit(item);
                            if (e.key === "Escape") { setEditingId(null); }
                          }}
                          onBlur={() => commitEdit(item)}
                        />
                        <ChoicesEditor
                          choices={editChoices}
                          onChange={setEditChoices}
                        />
                      </div>
                    ) : (
                      <span
                        className="flex-1 text-sm text-foreground/85 leading-snug cursor-pointer py-1 rounded hover:text-foreground transition-colors"
                        onClick={() => startEdit(item)}
                        title="Click to edit"
                      >
                        {item.description}
                      </span>
                    )}

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {editingId !== item.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => startEdit(item)}
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this observation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &ldquo;{item.description}&rdquo; will be permanently
                              deleted. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSaved(item)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                {/* New draft rows */}
                {newDrafts.map((draft, idx) => (
                  <div key={draft.key} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-semibold text-primary">
                        {savedItems.length + idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <Input
                        ref={idx === newDrafts.length - 1 ? lastNewRef : undefined}
                        value={draft.description}
                        onChange={(e) =>
                          setNewDrafts((prev) =>
                            prev.map((d) =>
                              d.key === draft.key ? { ...d, description: e.target.value } : d
                            )
                          )
                        }
                        placeholder="New observation…"
                        className="text-sm h-8"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); addNewDraft(); }
                        }}
                      />
                      <ChoicesEditor
                        choices={draft.choices}
                        onChange={(newChoices) =>
                          setNewDrafts((prev) =>
                            prev.map((d) =>
                              d.key === draft.key ? { ...d, choices: newChoices } : d
                            )
                          )
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                      onClick={() => removeNewDraft(draft.key)}
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/5 px-2"
              onClick={addNewDraft}
            >
              <Plus className="w-3.5 h-3.5" />
              Add observation
            </Button>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
            disabled={isSaving}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="bg-primary text-primary-foreground text-xs font-bold"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// ─── AddObservationDialog ─────────────────────────────────────────────────────
// Quick single-field dialog to add one observation to an existing category.

interface AddObservationDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: ObservationCategory;
}

function AddObservationDialog({ open, onOpenChange, category }: AddObservationDialogProps) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (open) { setDescription(""); setChoices([]); }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (!trimmed) return;
    setIsPending(true);
    try {
      await fetch(`/api/admin/observations/categories/${category.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: trimmed,
          choices: choices.length > 0 ? choices : undefined,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["observation-categories"] });
      onOpenChange(false);
      toast.success("Observation added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add observation");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Add Observation — {category.title}</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
              Observation Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Pays attention and follows instructions"
              className="w-full text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && description.trim()) handleSubmit();
              }}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
              Rating Options (optional)
            </label>
            <ChoicesEditor choices={choices} onChange={setChoices} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs" disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || isPending}
            className="bg-primary text-primary-foreground text-xs font-bold"
          >
            {isPending ? "Adding..." : "Add Observation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: ObservationCategory;
}

function CategoryCard({ category }: CategoryCardProps) {
  const deleteCategory = useDeleteObservationCategory();

  const [editOpen, setEditOpen] = useState(false);
  const [addObsOpen, setAddObsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const items = category.items ?? [];

  const handleDeleteCategory = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Category deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  return (
    <>
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary/10 shrink-0 mt-0.5">
              <ListChecks className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-foreground leading-snug truncate">
                {category.title}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {items.length} observation{items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Add observation quick button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/8 px-2"
                onClick={() => setAddObsOpen(true)}
                title="Add observation"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Observation
              </Button>

              {/* Edit opens the full EditCategoryDialog */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Edit category"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete &ldquo;{category.title}&rdquo;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the category and all{" "}
                      {items.length > 0 ? (
                        <strong>
                          {items.length} observation
                          {items.length !== 1 ? "s" : ""}
                        </strong>
                      ) : (
                        "its observations"
                      )}{" "}
                      under it. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCategory}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
                    >
                      Delete Category
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
                title={collapsed ? "Expand" : "Collapse"}
                onClick={() => setCollapsed((v) => !v)}
              >
                {collapsed ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {!collapsed && (
          <>
            {items.length > 0 && <Separator className="mx-4 w-auto" />}
            <CardContent className="pt-1 pb-3 px-2">
              {items.length === 0 ? (
                <div className="py-5 text-center">
                  <p className="text-xs text-muted-foreground/60">
                    No observations yet.{" "}
                    <button
                      className="underline text-primary/70 hover:text-primary transition-colors"
                      onClick={() => setEditOpen(true)}
                    >
                      Add the first one
                    </button>
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[280px]">
                  <div className="space-y-0.5 py-1">
                    {items.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </>
        )}
      </Card>

      <EditCategoryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        category={category}
      />

      <AddObservationDialog
        open={addObsOpen}
        onOpenChange={setAddObsOpen}
        category={category}
      />
    </>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function ObservationsClient() {
  const { data: categories, isLoading, isError } = useObservationCategories(true);

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Observations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage observation categories and their items
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Body */}
      {isLoading ? (
        <ObservationsSkeleton />
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load observation categories.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Please refresh the page and try again.
          </p>
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-14 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/25 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No observation categories yet
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
            Create your first category to start adding observations
          </p>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}

      {/* Create category dialog (title + inline items) */}
      <CreateCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </motion.div>
  );
}
