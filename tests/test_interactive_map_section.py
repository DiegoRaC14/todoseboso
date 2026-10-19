"""Static-contract tests for the externally hosted Andrea-HH map section.

The live map's tiles and parcel data are hosted by the collaborator and
cannot be verified in an offline repository test.
"""
from pathlib import Path
import unittest

SITE = Path(__file__).resolve().parents[1] / "site"
MAP_URL = "https://andrea-hh.github.io/todoseboso/explorador/mapa.html"


class AndreaMapSectionTest(unittest.TestCase):
    def test_map_is_its_own_final_section(self):
        html = (SITE / "index.html").read_text(encoding="utf-8")
        self.assertIn('id="mapa-interactivo"', html)
        self.assertEqual(html.count('id="mapa-interactivo"'), 1)
        self.assertLess(html.index('id="simulador"'), html.index('id="mapa-interactivo"'))
        self.assertLess(html.index('id="mapa-interactivo"'), html.index("</main>"))
        self.assertEqual(html.count('src="' + MAP_URL + '"'), 1)

    def test_map_is_accessible_and_isolated(self):
        html = (SITE / "index.html").read_text(encoding="utf-8")
        self.assertIn('href="./interactive-map.css"', html)
        self.assertIn('title="Mapa interactivo de GeoCebada', html)
        self.assertIn('loading="lazy"', html)
        self.assertIn('aria-describedby="collaborator-map-credit"', html)
        self.assertIn('href="' + MAP_URL + '"', html)
        self.assertIn("Andrea-HH", html)
        css = (SITE / "interactive-map.css").read_text(encoding="utf-8")
        self.assertIn(".collaborator-map-frame iframe", css)
        self.assertIn("@media(max-width:720px)", css)


if __name__ == "__main__":
    unittest.main()
