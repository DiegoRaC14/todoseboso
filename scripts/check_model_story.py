#!/usr/bin/env python3
"""Public single-model page contract, against the actual frozen model manifest."""
from __future__ import annotations
import json
import math
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.anchors = []
        self.assets = []
        self.scripts = []
        self.lang = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        if "id" in a:
            assert a["id"] not in self.ids, ("duplicate id", a["id"])
            self.ids.add(a["id"])
        if tag == "a" and a.get("href", "").startswith("#"):
            self.anchors.append(a["href"][1:])
        if tag in {"script", "img", "link"}:
            url = a.get("src", a.get("href", ""))
            if url.startswith("./"):
                self.assets.append(url)
            if tag == "script":
                self.scripts.append(url)


def check() -> None:
    data = json.loads((SITE / "data/model.json").read_text(encoding="utf-8"))
    manifest = json.loads((ROOT / "configs/current_champions_inputs.json").read_text(encoding="utf-8"))
    desc = (ROOT / "documentation/models/Reference26/README.md").read_text(encoding="utf-8")
    html = (SITE / "index.html").read_text(encoding="utf-8")
    js = (SITE / "model.js").read_text(encoding="utf-8")
    assert data["schema_version"] == 1 and data["code_name"] == "Reference26"
    blocks = data["features"]
    assert [b["key"] for b in blocks] == ["clima","local","ubicacion","geologia","correccion"]
    assert [len(b["features"]) for b in blocks] == [4, 7, 2, 10, 3]
    columns = [f["code"] for b in blocks for f in b["features"]]
    assert columns == manifest["features"], "The 26 inputs must exactly match training recipe"
    assert [f["number"] for b in blocks for f in b["features"]] == list(range(1, 27))
    assert all(f["name"] and f["how"] and f["interpret"] for b in blocks for f in b["features"])
    fit = data["final_fit"]
    for key, expected in {
        "known": 138, "unknown": 59, "local_neighbors": 24,
        "local_ridge_alpha": 30, "distance_power": 1,
        "geologic_groups": 4, "geologic_regularization": 20,
        "ct3_alpha": 0.1, "ct3_l1_ratio": 0.1,
        "internal_alpha": .001, "internal_l1_ratio": .9,
        "internal_amplitude": .5, "r3_alpha": .01,
        "r3_l1_ratio": .5, "r3_strength": 1,
        "r3_limit": .25, "r3_available": 51, "r3_missing": 8,
        "global_weight_anchor": .779654,
    }.items():
        assert math.isclose(fit[key], expected, abs_tol=1e-12), key
    weights = [.372869, .855580, .816305, .866107]
    assert len(fit["cluster_weights"]) == 4
    for x, y in zip(weights, fit["cluster_weights"]):
        assert 0 <= y <= 1
        assert math.isclose(x, y, abs_tol=1e-12)
    assert fit["r3_available"] + fit["r3_missing"] == fit["unknown"]
    assert data["selection"]["geology_groups"] == [4, 8]
    assert data["selection"]["climate_alpha"] == [.001, .01, .1, 1]
    for fragment in (".372869", ".855580", ".816305", ".866107",
                     ".779654", "alpha .001", "alpha .1", "24 vecinos",
                     "±.25", "51 completas", "8 se desactiva"):
        assert fragment in desc, ("model document missing", fragment)

    page = Page()
    page.feed(html)
    assert page.lang == "es"
    for target in ("contenido", "datos", "variables", "preparacion", "arquitectura",
                   "geologia", "faltantes", "ajuste", "resultados", "pruebas",
                   "limites", "preguntas", "rain-chart", "cluster-list",
                   "feature-rows", "performance-chart", "r3-comparison",
                   "association-chart", "distribution-quantiles", "interval-results",
                   "expert-weights", "hhi-forest"):
        assert target in page.ids, target
    assert all(a in page.ids for a in page.anchors), "Broken internal navigation"
    for asset in page.assets:
        assert (SITE / asset).is_file(), ("missing site asset", asset)
    assert page.scripts == ["./charts.js", "./model.js"]
    for forbidden in ("LOOCV", "Compact14", "Champion", "B1</", "Local04D"):
        assert forbidden not in html, forbidden
    for required in ("Regresión local con mezcla geológica", "K-means",
                     "mediana", "faltantes", "24 vecinas", "α = 30",
                     "0.4625", "0.3387", "0.6971", "952", "3 de 4",
                     "51", "8", "11", "3.9564", "3.9554", "2025"):
        assert required in html, required
    assert "https://cdn." not in html + js
    assert "train138.parquet" not in html
    assert "./data/model.json" in js or '"model.json"' in js
    assert "GeoCharts.performance" in js
    assert "GeoCharts.forest" in js
    assert "GeoCharts.distribution" in js
    print("Single-model page PASS: 26 precise source variables, training settings, labels and public chart contracts.")


if __name__ == "__main__":
    check()
