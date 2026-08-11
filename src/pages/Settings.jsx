import { useEffect, useState } from "react";
import { api } from "../api";

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((data) =>
        setForm({
          ...data,
          ovCc: (data.ovCc || []).join(", "),
          banqueCc: (data.banqueCc || []).join(", "),
        })
      )
      .catch((err) => setError(err.message));
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const saved = await api.saveSettings({
        ovTo: form.ovTo,
        ovCc: form.ovCc,
        banqueTo: form.banqueTo,
        banqueCc: form.banqueCc,
        compteDebiteurNom: form.compteDebiteurNom,
        compteDebiteurId: form.compteDebiteurId,
        compteDouaneNom: form.compteDouaneNom,
        compteDouaneId: form.compteDouaneId,
        compteTresorNom: form.compteTresorNom,
        compteTresorId: form.compteTresorId,
        signatureMail: form.signatureMail,
      });
      setForm({
        ...saved,
        ovCc: (saved.ovCc || []).join(", "),
        banqueCc: (saved.banqueCc || []).join(", "),
      });
      setMessage("Paramètres enregistrés");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form && !error) return <p className="page muted">Chargement…</p>;
  if (!form) {
    return (
      <div className="page">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Paramètres</h1>
          <p className="muted">
            Destinataires emails et comptes créditeurs Douane / Trésor.
          </p>
        </div>
      </header>

      {error && <p className="error banner">{error}</p>}
      {message && <p className="success banner">{message}</p>}

      <form className="settings-form" onSubmit={onSubmit}>
        <fieldset>
          <legend>Demande OV (comptable)</legend>
          <label>
            Destinataire
            <input
              type="email"
              value={form.ovTo || ""}
              onChange={(e) => update("ovTo", e.target.value)}
              required
            />
          </label>
          <label>
            Copie (CC) — séparés par des virgules
            <input
              value={form.ovCc || ""}
              onChange={(e) => update("ovCc", e.target.value)}
              placeholder="copie1@mail.com, copie2@mail.com"
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Envoi banque</legend>
          <label>
            Destinataire
            <input
              type="email"
              value={form.banqueTo || ""}
              onChange={(e) => update("banqueTo", e.target.value)}
              required
            />
          </label>
          <label>
            Copie (CC) — séparés par des virgules
            <input
              value={form.banqueCc || ""}
              onChange={(e) => update("banqueCc", e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Comptes</legend>
          <label>
            Débiteur — nom
            <input
              value={form.compteDebiteurNom || ""}
              onChange={(e) => update("compteDebiteurNom", e.target.value)}
            />
          </label>
          <label>
            Débiteur — N° compte
            <input
              value={form.compteDebiteurId || ""}
              onChange={(e) => update("compteDebiteurId", e.target.value)}
            />
          </label>
          <label>
            Douane — nom
            <input
              value={form.compteDouaneNom || ""}
              onChange={(e) => update("compteDouaneNom", e.target.value)}
            />
          </label>
          <label>
            Douane — N° compte
            <input
              value={form.compteDouaneId || ""}
              onChange={(e) => update("compteDouaneId", e.target.value)}
            />
          </label>
          <label>
            Trésor — nom
            <input
              value={form.compteTresorNom || ""}
              onChange={(e) => update("compteTresorNom", e.target.value)}
            />
          </label>
          <label>
            Trésor — N° compte
            <input
              value={form.compteTresorId || ""}
              onChange={(e) => update("compteTresorId", e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Signature mail</legend>
          <label>
            <textarea
              rows={4}
              value={form.signatureMail || ""}
              onChange={(e) => update("signatureMail", e.target.value)}
            />
          </label>
        </fieldset>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
