"""Ensure published chart measurements are real, internally consistent aggregates."""
from __future__ import annotations

import json
import math
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "site/data/real_charts.json"
SOURCE_SHA256 = "971bdac1808036e7ca9be3260faa7608e82e2530ef0285a0c0f432a6fae2d635"


class RealChartsTest(unittest.TestCase):
    def test_public_snapshot_has_correct_source_and_monthly_coverage(self):
        d = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        self.assertEqual(d["schema_version"], 1)
        self.assertEqual(d["kind"], "real_chart_aggregates")
        self.assertEqual(d["sources"][0]["sha256"], SOURCE_SHA256)
        self.assertEqual(d["sources"][0]["file"], "monthly_inputs_apr_oct.parquet")
        self.assertEqual(d["sources"][0]["records"], 5516)
        self.assertEqual(d["sources"][0]["distinct_parcels"], 197)
        self.assertEqual(d["sources"][0]["years"], [2022, 2023, 2024, 2025])
        self.assertEqual(d["loocv_models"], [],
                         "Do not publish invented residuals without individual OOF files.")
        for name in ("rainfall", "ndvi"):
            source = d[name]
            self.assertEqual(source["year"], 2025)
            self.assertEqual(len(source["months"]), 7)
            self.assertEqual(source["variable"], "precipitation" if name == "rainfall" else "ndvi")
            for m, row in enumerate(source["months"], start=4):
                self.assertEqual(row["month"], m)
                self.assertEqual(row["n"], 197)
                self.assertLessEqual(row["p10"], row["median"])
                self.assertLessEqual(row["median"], row["p90"])
                self.assertTrue(all(math.isfinite(row[k])
                                    for k in ("mean", "median", "p10", "p90")))
                if name == "rainfall":
                    self.assertGreaterEqual(row["p10"], 0)
                else:
                    self.assertGreaterEqual(row["p10"], -1)
                    self.assertLessEqual(row["p90"], 1)

    def test_source_tied_values_not_placeholder_rainfall(self):
        d = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        rain = d["rainfall"]["months"]
        ndvi = d["ndvi"]["months"]
        self.assertAlmostEqual(rain[2]["median"], 237.6761016845703, places=11)
        self.assertAlmostEqual(ndvi[5]["median"], 0.545, places=12)
        self.assertNotEqual(sum(r["median"] for r in rain), 210.0)
        # The website's 210 mm exercise is separate, explicitly fictional.

    def test_no_parcel_level_identifiers_in_export(self):
        data = SNAPSHOT.read_text(encoding="utf-8")
        for forbidden in ("ID_POLIGONO", "AGC_001", "y_true", "y_pred", "base_centroid_lat"):
            self.assertNotIn(forbidden, data)


if __name__ == "__main__":
    unittest.main()
