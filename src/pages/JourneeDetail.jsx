import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import {
  formatDate,
  formatMontant,
  formatPeriode,
  STATUT_LABELS,
  statutClass,
} from "../utils";

function RecapCard({ title, lot }) {
  return (
    <section className="recap-card">
      <h2>{title}</h2>
      <dl>
        <div>
          <dt>Transactions</dt>
          <dd>{lot?.nbTx || 0}</dd>
        </div>
        <div>
          <dt>Montant (MRU)</dt>
          <dd>{formatMontant(lot?.montantTotal)}</dd>
        </div>
        <div>
          <dt>Reason types</dt>
          <dd>{(lot?.reasonTypes || []).join(", ") || "—"}</dd>
        </div>
      </dl>
    </section>
  );
}

function DetailsParJour({ details }) {
  if (!details?.length) return null;

  return (
    <section className="panel">
      <h2>Détail par journée</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Douane (tx)</th>
              <th>Douane (MRU)</th>
              <th>Trésor (tx)</th>
              <th>Trésor (MRU)</th>
            </tr>
          </thead>
          <tbody>
            {details.map((day) => (
              <tr key={String(day.date)}>
                <td>{formatDate(day.date)}</td>
                <td>{day.douane?.nbTx || 0}</td>
                <td>{formatMontant(day.douane?.montantTotal)}</td>
                <td>{day.tresor?.nbTx || 0}</td>
                <td>{formatMontant(day.tresor?.montantTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function JourneeDetail() {
  const { id } = useParams();
  const [journee, setJournee] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyOv, setBusyOv] = useState(false);
  const [busyBanque, setBusyBanque] = useState(false);
  const ovRef = useRef(null);
  const sendingOvRef = useRef(false);
  const sendingBanqueRef = useRef(false);

  async function load() {
    const data = await api.getJournee(id);
    setJournee(data);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [id]);

  async function envoyerDemande() {
    if (sendingOvRef.current) return;
    sendingOvRef.current = true;
    setError("");
    setMessage("");
    setBusyOv(true);
    try {
      const res = await api.envoyerDemandeOv(id);
      setMessage(`Demande OV envoyée à ${res.email.to.join(", ")}`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyOv(false);
      sendingOvRef.current = false;
    }
  }

  async function onOvChange(e) {
    const file = e.target.files?.[0];
    if (!file || sendingBanqueRef.current) return;
    sendingBanqueRef.current = true;
    setError("");
    setMessage("");
    setBusyBanque(true);
    try {
      const res = await api.uploadOv(id, file);
      setMessage(
        `OV uploadée — XML générés et email banque envoyé à ${res.email.to.join(", ")}`
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyBanque(false);
      sendingBanqueRef.current = false;
      if (ovRef.current) ovRef.current.value = "";
    }
  }

  if (!journee && !error) {
    return <p className="page muted">Chargement…</p>;
  }

  if (!journee) {
    return (
      <div className="page">
        <p className="error">{error}</p>
        <Link to="/">Retour</Link>
      </div>
    );
  }

  const canSendOv = ["brouillon", "demande_ov_envoyee"].includes(journee.statut);
  const canUploadOv = [
    "demande_ov_envoyee",
    "ov_recue",
    "envoye_banque",
  ].includes(journee.statut);

  const debut = journee.dateDebut || journee.dateComptable;
  const fin = journee.dateFin || journee.dateComptable;
  const periode = formatPeriode(debut, fin);
  const multiJours =
    formatDate(debut) !== formatDate(fin) ||
    (journee.detailsParJour || []).length > 1;

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/">Journées</Link> / {periode}
      </p>

      <header className="page-header">
        <div>
          <h1>
            {multiJours
              ? `Demande d'ordre de virement du ${formatDate(debut)} au ${formatDate(fin)}`
              : `Journée du ${formatDate(debut)}`}
          </h1>
          <p className="muted">
            Fichier source : {journee.sourceExcelOriginalName || "—"}
          </p>
          <span className={statutClass(journee.statut)}>
            {STATUT_LABELS[journee.statut] || journee.statut}
          </span>
        </div>
      </header>

      {error && <p className="error banner">{error}</p>}
      {message && <p className="success banner">{message}</p>}

      <div className="recap-grid">
        <RecapCard title="Douane (total)" lot={journee.douane} />
        <RecapCard title="Trésor (total)" lot={journee.tresor} />
      </div>

      <DetailsParJour details={journee.detailsParJour} />

      <section className="panel">
        <h2>1. Demande d&apos;ordre de virement</h2>
        <p className="muted">
          Envoie un email unique au comptable avec les tableaux Douane et Trésor
          {multiJours ? " (une ligne par journée)" : ""}.
        </p>
        <button
          type="button"
          className="btn-primary"
          disabled={!canSendOv || busyOv}
          onClick={envoyerDemande}
        >
          {busyOv ? "Envoi…" : "Envoyer demande ordre de virement"}
        </button>
      </section>

      <section className="panel">
        <h2>2. Upload photo OV (WhatsApp)</h2>
        <p className="muted">
          Après réception de l&apos;OV, uploadez la photo. Les XML Douane/Trésor
          seront générés automatiquement et envoyés à la banque avec la photo.
        </p>
        <input
          ref={ovRef}
          type="file"
          accept="image/*,.pdf"
          hidden
          onChange={onOvChange}
        />
        <button
          type="button"
          className="btn-primary"
          disabled={!canUploadOv || busyBanque}
          onClick={() => ovRef.current?.click()}
        >
          {busyBanque ? "Traitement…" : "Uploader OV et envoyer à la banque"}
        </button>
        {journee.ovPhotoOriginalName && (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            OV actuelle : {journee.ovPhotoOriginalName}
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Historique des emails</h2>
        {(journee.emails || []).length === 0 ? (
          <p className="muted">Aucun email envoyé pour cette journée.</p>
        ) : (
          <ul className="email-list">
            {journee.emails.map((m, i) => (
              <li key={`${m.type}-${i}`}>
                <strong>{m.type === "demande_ov" ? "Demande OV" : "Banque"}</strong>
                {" — "}
                {m.subject}
                <br />
                <span className="muted">
                  À {((m.to || []).join(", ") || "—")} ·{" "}
                  {m.sentAt ? new Date(m.sentAt).toLocaleString("fr-FR") : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
