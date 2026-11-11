import { z } from "zod";
import kaynaklarHam from "../../data/tarih/kaynaklar.json";
import olaylarHam from "../../data/tarih/olaylar.json";
import karakterlerHam from "../../data/tarih/karakterler.json";
import { KaynakSemasi, OlaySemasi, KarakterSemasi } from "./sema";

/** Tarihsel veriyi şemayla doğrulayarak yükler. Geçersiz veri hata fırlatır. */
export function tarihselVeriyiYukle() {
  return {
    kaynaklar: z.array(KaynakSemasi).parse(kaynaklarHam),
    olaylar: z.array(OlaySemasi).parse(olaylarHam),
    karakterler: z.array(KarakterSemasi).parse(karakterlerHam),
  };
}
