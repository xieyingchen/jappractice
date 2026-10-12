import unittest

import jappractice
from jappractice.data import load_words, normalize_answer


class PackageSmokeTest(unittest.TestCase):
    def test_version_is_available(self) -> None:
        self.assertEqual(jappractice.__version__, "0.1.0")

    def test_source_workbooks_are_loaded_and_deduplicated(self) -> None:
        words = load_words()
        verbs = [word for word in words if word["kind"] == "verb"]
        adjectives = [word for word in words if word["kind"] == "adjective"]
        self.assertEqual(len(verbs), 139)
        self.assertEqual(len(adjectives), 89)
        self.assertNotIn("すみます", {word["original"] for word in verbs})

    def test_answer_normalization_handles_width_and_spaces(self) -> None:
        self.assertEqual(normalize_answer("  食べる　"), "食べる")

    def test_na_adjective_accepts_optional_na(self) -> None:
        word = next(word for word in load_words() if word["original"] == "有名（な）")
        self.assertIn("有名", word["answers"])
        self.assertIn("有名な", word["answers"])
        self.assertIn("ゆうめい", word["answers"])

    def test_verb_accepts_dictionary_and_masu_forms(self) -> None:
        words = load_words()
        ichidan = next(word for word in words if word["original"] == "食べる")
        self.assertTrue({"食べる", "たべる", "食べます", "たべます"} <= set(ichidan["answers"]))

        godan = next(word for word in words if word["original"] == "帰る")
        self.assertTrue({"帰る", "かえる", "帰ります", "かえります"} <= set(godan["answers"]))

        okureru = next(word for word in words if word["original"] == "遅れる")
        self.assertTrue({"遅れる", "おくれる", "遅れます", "おくれます"} <= set(okureru["answers"]))


if __name__ == "__main__":
    unittest.main()
