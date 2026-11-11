"""Oyunu tek dosyalık HTML önizlemesine çevirir. Kullanım: python3 -I scripts/onizleme-uret.py <çıktı.html>
Önce: npx vite build -c vite.tekdosya.config.ts"""
import re, sys
s = open("dist-tek/index.html", encoding="utf-8").read()
stil = "".join(re.findall(r"<style[^>]*>.*?</style>", s, flags=re.S))
betik = "".join(re.findall(r"<script[^>]*>.*?</script>", s, flags=re.S))
assert stil and betik
open(sys.argv[1], "w", encoding="utf-8").write("<title>Mondros'tan Sonra</title>\n" + stil + '\n<div id="kok"></div>\n' + betik + "\n")
