import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import {
  formatDate,
  formatMontant,
  formatPeriode,
  STATUT_LABELS,
  statutClass,
} from "../utils";

export default function Home() {
  const [journees, setJournees] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);

  async function load() {
    try {
      const data = await api.listJournees();
      setJournees(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    setUploading(true);
    try {
      const created = await api.uploadExcel(file);
      const periode = formatPeriode(created.dateDebut, created.dateFin);
      setMessage(
        `Fichier importé (${periode}) — Douane ${created.douane.nbTx} tx / Trésor ${created.tresor.nbTx} tx`
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Supprimer ce brouillon ?")) return;
    setError("");
    setMessage("");
    setDeletingId(id);
    try {
      await api.deleteJournee(id);
      setMessage("Brouillon supprimé");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Journées comptables</h1>
          <p className="muted">
            Importez l&apos;export Excel du SP portal, puis traitez la demande OV
            et l&apos;envoi banque.
          </p>
        </div>
        <div className="actions">
          <input
            ref={inputRef}
            type="file"
            accept=".xls,.xlsx"
            hidden
            onChange={onFileChange}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Import en cours…" : "Uploader Excel"}
          </button>
        </div>
      </header>

      {error && <p className="error banner">{error}</p>}
      {message && <p className="success banner">{message}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th>Statut</th>
              <th>Douane</th>
              <th>Trésor</th>
              <th>Total MRU</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {journees.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  Aucune journée pour le moment. Uploadez un export Excel.
                </td>
              </tr>
            )}
            {journees.map((j) => {
              const total =
                Number(j.douane?.montantTotal || 0) +
                Number(j.tresor?.montantTotal || 0);
              const debut = j.dateDebut || j.dateComptable;
              const fin = j.dateFin || j.dateComptable;
              return (
                <tr key={j._id}>
                  <td>{formatPeriode(debut, fin)}</td>
                  <td>
                    <span className={statutClass(j.statut)}>
                      {STATUT_LABELS[j.statut] || j.statut}
                    </span>
                  </td>
                  <td>
                    {j.douane?.nbTx || 0} tx · {formatMontant(j.douane?.montantTotal)}
                  </td>
                  <td>
                    {j.tresor?.nbTx || 0} tx · {formatMontant(j.tresor?.montantTotal)}
                  </td>
                  <td>{formatMontant(total)}</td>
                  <td className="row-actions">
                    <Link to={`/journees/${j._id}`} className="link">
                      Ouvrir
                    </Link>
                    {j.statut === "brouillon" && (
                      <button
                        type="button"
                        className="btn-danger-link"
                        disabled={deletingId === j._id}
                        onClick={() => onDelete(j._id)}
                      >
                        {deletingId === j._id ? "…" : "Supprimer"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
