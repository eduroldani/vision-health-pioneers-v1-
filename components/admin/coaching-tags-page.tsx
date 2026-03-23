"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ProgramManagementNav } from "@/components/admin/program-management-nav";
import type { CoachingTagRecord, ParentCoachingWithRelationsRecord } from "@/components/admin/types";
import {
  createCoachingTag,
  fetchParentCoachingsOverview,
  updateCoachingTag,
} from "@/lib/supabase/program-management";

export function CoachingTagsPage() {
  const [tags, setTags] = useState<CoachingTagRecord[]>([]);
  const [parentCoachings, setParentCoachings] = useState<ParentCoachingWithRelationsRecord[]>([]);
  const [selectedTag, setSelectedTag] = useState<CoachingTagRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagDescription, setTagDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const data = await fetchParentCoachingsOverview();
      setTags(data.coachingTags);
      setParentCoachings(data.parentCoachings);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load tags.");
    } finally {
      setIsLoading(false);
    }
  }

  const coachingsByTag = useMemo(() => {
    return parentCoachings.reduce<Record<string, ParentCoachingWithRelationsRecord[]>>((accumulator, coaching) => {
      if (!coaching.tags || coaching.tags.length === 0) {
        return accumulator;
      }

      coaching.tags.forEach((tag) => {
        if (!accumulator[tag]) {
          accumulator[tag] = [];
        }

        accumulator[tag].push(coaching);
      });
      return accumulator;
    }, {});
  }, [parentCoachings]);

  async function handleCreateTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createCoachingTag(tagName, tagDescription);
      setTagName("");
      setTagDescription("");
      setIsCreateModalOpen(false);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create tag.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTag) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateCoachingTag(selectedTag.id, tagName, tagDescription);
      setSelectedTag(null);
      setTagName("");
      setTagDescription("");
      setIsEditModalOpen(false);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update tag.");
    } finally {
      setIsSaving(false);
    }
  }

  function openEditModal(tag: CoachingTagRecord) {
    setSelectedTag(tag);
    setTagName(tag.name);
    setTagDescription(tag.description ?? "");
    setIsEditModalOpen(true);
  }

  return (
    <div className="page-stack">
      <section className="workspace-card page-card">
        <div className="card-heading page-heading">
          <div>
            <h2>Coach session tags</h2>
            <p>See all tags in one place, review their related coach sessions, and update names or descriptions clearly.</p>
          </div>
          <button type="button" className="login-button admin-button" onClick={() => setIsCreateModalOpen(true)}>
            Add tag
          </button>
        </div>
        <ProgramManagementNav />
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      </section>

      <section className="workspace-card page-card">
        <div className="card-heading">
          <div>
            <h2>All tags</h2>
            <p>{isLoading ? "Loading tags..." : `${tags.length} tag records`}</p>
          </div>
        </div>

        {!isLoading && tags.length === 0 ? (
          <div className="empty-state">No tags created yet.</div>
        ) : (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Related coach sessions</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => {
                  const relatedCoachings = coachingsByTag[tag.name] ?? [];

                  return (
                    <tr key={tag.id}>
                      <td>
                        <button type="button" className="table-link-button" onClick={() => openEditModal(tag)}>
                          {tag.name}
                        </button>
                      </td>
                      <td>{tag.description ?? "—"}</td>
                      <td>
                        {relatedCoachings.length > 0 ? (
                          <div className="table-inline-pills">
                            {relatedCoachings.slice(0, 3).map((coaching) => (
                              <span key={coaching.id} className="pill">
                                {coaching.name}
                              </span>
                            ))}
                            {relatedCoachings.length > 3 ? <span className="role-placeholder">+{relatedCoachings.length - 3} more</span> : null}
                          </div>
                        ) : (
                          "No coach sessions yet"
                        )}
                      </td>
                      <td>{tag.created_at.slice(0, 10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isCreateModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-shell compact-modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>Add tag</h2>
                <p>Create a reusable label for coach sessions.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsCreateModalOpen(false)}>
                Close
              </button>
            </div>

            <form className="resource-form" onSubmit={handleCreateTag}>
              <label className="field">
                <span>Name</span>
                <input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="Financial planning" />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea rows={3} value={tagDescription} onChange={(event) => setTagDescription(event.target.value)} />
              </label>

              <div className="form-actions">
                <button type="submit" className="login-button form-action-button" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Add tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditModalOpen && selectedTag ? (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-shell compact-modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="page-heading">
              <div className="card-heading">
                <h2>Edit tag</h2>
                <p>Update the tag name and description, and review the linked coach sessions.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsEditModalOpen(false)}>
                Close
              </button>
            </div>

            <form className="resource-form" onSubmit={handleUpdateTag}>
              <label className="field">
                <span>Name</span>
                <input value={tagName} onChange={(event) => setTagName(event.target.value)} />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea rows={3} value={tagDescription} onChange={(event) => setTagDescription(event.target.value)} />
              </label>

              <div className="record-subsection">
                <strong>Related coach sessions</strong>
                <div className="pill-row">
                  {(coachingsByTag[selectedTag.name] ?? []).length > 0 ? (
                    (coachingsByTag[selectedTag.name] ?? []).map((coaching) => (
                      <span key={coaching.id} className="pill">
                        {coaching.name}
                      </span>
                    ))
                  ) : (
                    <span className="role-placeholder">No coach sessions linked to this tag yet.</span>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="login-button form-action-button" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
