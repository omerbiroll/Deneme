import { useMemo, useState } from "react";
import { SOZLUK, bol } from "./sozluk";

/** Zor terimleri dokunulabilir yapar; dokununca açıklama paragrafın altında açılır. */
export function TerimliMetin({ metin, sinif }: { metin: string; sinif?: string }) {
  const [acik, setAcik] = useState<string | null>(null);
  const parcalar = useMemo(() => bol(metin), [metin]);
  return (
    <>
      <p className={sinif}>
        {parcalar.map((p, i) =>
          p.terim ? (
            <button key={i} type="button" className="terim" aria-expanded={acik === p.terim} onClick={() => setAcik(acik === p.terim ? null : p.terim!)}>
              {p.metin}
            </button>
          ) : (
            <span key={i}>{p.metin}</span>
          ),
        )}
      </p>
      {acik && (
        <p className="terim-aciklama" role="note">
          <strong>{acik}:</strong> {SOZLUK[acik]}
        </p>
      )}
    </>
  );
}
