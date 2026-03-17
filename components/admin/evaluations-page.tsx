"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  AssignmentRecord,
  assignmentStatusOptions,
  ProfileRecord,
  StartupRecord,
} from "@/components/admin/types";

type EvaluationFormState = {
  startup_id: string;
  profile_id: string;
  status: string;
  score: string;
  recommendation: string;
  notes: string;
};

const initialState: EvaluationFormState = {
  startup_id: "",
  profile_id: "",
  status: "assigned",
  score: "",
  recommendation: "",
  notes: "",
};

export function EvaluationsPage() {
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [form, setForm] = useState<EvaluationFormState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const evaluatorOptions = useMemo(() => profiles, [profiles]);

  const startupNameById = useMemo(() => {
    return startups.reduce<Record<string, string>>((accumulator, startup) => {
      accumulator[startup.id] = startup.name;
      return accumulator;
    }, {});
  }, [startups]);

  const profileNameById = useMemo(() => {
    return profiles.reduce<Record<string, string>>((accumulator, profile) => {
      accumulator[profile.id] = `${profile.first_name} ${profile.last_name}`.trim();
      return accumulator;
    }, {});
  }, [profiles]);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createBrowserSupabaseClient();
        const [
          { data: startupsData, error: startupsError },
          { data: profilesData, error: profilesError },
          { data: assignmentsData, error: assignmentsError },
        ] = await Promise.all([
          supabase
            .from("startups")
            .select("id, name, created_at, updated_at")
            .order("name", { ascending: true }),
          supabase
            .from("profiles")
            .select("id, first_name, last_name, email, linkedin_url, website_url, notes, created_by_profile_id, created_at, updated_at, record_status")
            .order("first_name", { ascending: true }),
          supabase
            .from("assignments")
            .select(
              "id, startup_id, profile_id, assignment_type, status, score, recommendation, notes, due_date, submitted_at, form_url, created_at, updated_at",
            )
            .eq("assignment_type", "evaluation")
            .order("updated_at", { ascending: false }),
        ]);

        if (startupsError || profilesError || assignmentsError) {
          throw new Error(
            startupsError?.message ??
              profilesError?.message ??
              assignmentsError?.message ??
              "Unable to load evaluations data.",
          );
        }

        const startupRows = (startupsData as StartupRecord[]) ?? [];
        const profileRows = (profilesData as ProfileRecord[]) ?? [];
        setStartups(startupRows);
        setProfiles(profileRows);
        setAssignments((assignmentsData as AssignmentRecord[]) ?? []);

        if (startupRows[0]) {
          setForm((current) => ({
            ...current,
            startup_id: current.startup_id || startupRows[0].id,
          }));
        }

        const defaultEvaluator = profileRows[0];
        if (defaultEvaluator) {
          setForm((current) => ({
            ...current,
            profile_id: current.profile_id || defaultEvaluator.id,
          }));
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load evaluations right now.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  async function refreshAssignments() {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("assignments")
      .select(
        "id, startup_id, profile_id, assignment_type, status, score, recommendation, notes, due_date, submitted_at, form_url, created_at, updated_at",
      )
      .eq("assignment_type", "evaluation")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    setAssignments((data as AssignmentRecord[]) ?? []);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const payload = {
        startup_id: form.startup_id,
        profile_id: form.profile_id,
        assignment_type: "evaluation",
        status: form.status,
        score: form.score ? Number(form.score) : null,
        recommendation: form.recommendation.trim() || null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const response = editingAssignmentId
        ? await supabase.from("assignments").update(payload).eq("id", editingAssignmentId)
        : await supabase.from("assignments").insert(payload);

      if (response.error) {
        throw new Error(response.error.message);
      }

      setForm((current) => ({
        ...initialState,
        startup_id: current.startup_id,
        profile_id: current.profile_id,
      }));
      setEditingAssignmentId(null);
      setSuccessMessage(
        editingAssignmentId
          ? "Evaluation updated successfully."
          : "Evaluation created successfully.",
      );
      await refreshAssignments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the evaluation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(record: AssignmentRecord) {
    setEditingAssignmentId(record.id);
    setForm({
      startup_id: record.startup_id,
      profile_id: record.profile_id,
      status: record.status,
      score: record.score?.toString() ?? "",
      recommendation: record.recommendation ?? "",
      notes: record.notes ?? "",
    });
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  function handleCancelEdit() {
    setEditingAssignmentId(null);
    setForm((current) => ({
      ...initialState,
      startup_id: current.startup_id,
      profile_id: current.profile_id,
    }));
  }

  return (
    <div className="workspace-grid">
      <section className="workspace-card">
        <div className="card-heading">
          <h2>{editingAssignmentId ? "Edit evaluation" : "New evaluation"}</h2>
          <p>Connect an evaluator profile with a startup and track its evaluation.</p>
        </div>

        {startups.length === 0 || evaluatorOptions.length === 0 ? (
          <div className="empty-state">
            You need at least one startup and one evaluator profile before creating evaluations.
          </div>
        ) : null}

        <form className="resource-form" onSubmit={handleSubmit}>
          <div className="form-two-columns">
            <label className="field">
              <span>Startup</span>
              <select
                value={form.startup_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startup_id: event.target.value }))
                }
                required
              >
                <option value="">{isLoading ? "Loading startups..." : "Select a startup"}</option>
                {startups.map((startup) => (
                  <option key={startup.id} value={startup.id}>
                    {startup.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Evaluator</span>
              <select
                value={form.profile_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, profile_id: event.target.value }))
                }
                required
              >
                <option value="">
                  {isLoading ? "Loading evaluators..." : "Select an evaluator"}
                </option>
                {evaluatorOptions.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {`${profile.first_name} ${profile.last_name}`.trim()}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-two-columns">
            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                {assignmentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Score</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.score}
                onChange={(event) => setForm((current) => ({ ...current, score: event.target.value }))}
                placeholder="8.5"
              />
            </label>
          </div>

          <label className="field">
            <span>Recommendation</span>
            <textarea
              rows={4}
              value={form.recommendation}
              onChange={(event) =>
                setForm((current) => ({ ...current, recommendation: event.target.value }))
              }
              placeholder="High-level recommendation."
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Internal notes for this evaluation."
            />
          </label>

          <div className="form-actions">
            <button
              type="submit"
              className="login-button form-action-button"
              disabled={isSubmitting || startups.length === 0 || evaluatorOptions.length === 0}
            >
              {isSubmitting
                ? "Saving..."
                : editingAssignmentId
                  ? "Update evaluation"
                  : "Create evaluation"}
            </button>

            {editingAssignmentId ? (
              <button
                type="button"
                className="secondary-button form-action-button"
                onClick={handleCancelEdit}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        {successMessage ? <p className="form-message form-message-success">{successMessage}</p> : null}
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
      </section>

      <section className="workspace-card">
        <div className="card-heading">
          <h2>Evaluation list</h2>
          <p>{isLoading ? "Loading evaluations..." : `${assignments.length} evaluations`}</p>
        </div>

        <div className="records-list">
          {!isLoading && assignments.length === 0 ? (
            <div className="empty-state">No evaluations yet.</div>
          ) : null}

          {assignments.map((assignment) => (
            <article key={assignment.id} className="record-card">
              <div className="record-topline">
                <h3>{startupNameById[assignment.startup_id] ?? "Unknown startup"}</h3>
                <span className="pill">{assignment.status}</span>
              </div>
              <div className="record-meta">
                <span>{profileNameById[assignment.profile_id] ?? "Unknown evaluator"}</span>
                <span>{assignment.score !== null ? `Score ${assignment.score}` : "No score"}</span>
              </div>
              {assignment.recommendation ? <p>{assignment.recommendation}</p> : null}
              {assignment.notes ? <p>{assignment.notes}</p> : null}
              <button
                type="button"
                className="secondary-button inline-button"
                onClick={() => handleEdit(assignment)}
              >
                Edit evaluation
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
