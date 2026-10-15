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
        self.assertEqual(len(verbs), 144)
        self.assertEqual(len(adjectives), 92)
        self.assertNotIn("すみます", {word["original"] for word in verbs})

    def test_answer_normalization_handles_width_and_spaces(self) -> None:
        self.assertEqual(normalize_answer("  食べる　"), "食べる")

    def test_na_adjective_accepts_optional_na(self) -> None:
        word = next(word for word in load_words() if word["original"] == "有名（な）")
        self.assertIn("有名", word["answers"])
        self.assertIn("有名な", word["answers"])
        self.assertIn("ゆうめい", word["answers"])

    def test_osoi_is_loaded_with_inflections(self) -> None:
        word = next(word for word in load_words() if word["original"] == "遅い")
        self.assertEqual(word["kana"], "おそい")
        self.assertEqual(word["accent"], "0")
        self.assertEqual(word["conjunctive_form"], "おそく")
        self.assertEqual(word["past_form"], "おそかった")
        self.assertTrue({"遅い", "おそい"} <= set(word["answers"]))

    def test_kanashii_is_loaded_with_inflections(self) -> None:
        word = next(word for word in load_words() if word["original"] == "悲しい")
        self.assertEqual(word["kana"], "かなしい")
        self.assertEqual(word["accent"], "0")
        self.assertEqual(word["conjunctive_form"], "かなしく")
        self.assertEqual(word["past_form"], "かなしかった")
        self.assertTrue({"悲しい", "かなしい"} <= set(word["answers"]))

    def test_okashii_is_loaded_with_inflections(self) -> None:
        word = next(word for word in load_words() if word["original"] == "おかしい")
        self.assertEqual(word["accent"], "3")
        self.assertEqual(word["conjunctive_form"], "おかしく")
        self.assertEqual(word["past_form"], "おかしかった")
        self.assertIn("おかしい", word["answers"])

    def test_verb_accepts_dictionary_and_masu_forms(self) -> None:
        words = load_words()
        ichidan = next(word for word in words if word["original"] == "食べる")
        self.assertTrue({"食べる", "たべる", "食べます", "たべます"} <= set(ichidan["answers"]))

        godan = next(word for word in words if word["original"] == "帰る")
        self.assertTrue({"帰る", "かえる", "帰ります", "かえります"} <= set(godan["answers"]))

        okureru = next(word for word in words if word["original"] == "遅れる")
        self.assertTrue({"遅れる", "おくれる", "遅れます", "おくれます"} <= set(okureru["answers"]))

        niau = next(word for word in words if word["original"] == "似合う")
        self.assertTrue({"似合う", "にあう", "似合います", "にあいます"} <= set(niau["answers"]))

        houkoku = next(word for word in words if word["original"] == "報告する")
        self.assertTrue(
            {"報告する", "ほうこくする", "報告します", "ほうこくします"}
            <= set(houkoku["answers"])
        )

        nakusu = next(word for word in words if word["original"] == "なくす")
        self.assertTrue({"なくす", "なくします"} <= set(nakusu["answers"]))

        nebou = next(word for word in words if word["original"] == "寝坊する")
        self.assertEqual(nebou["accent"], "[0]")
        self.assertEqual(nebou["transitivity"], "自动词")
        self.assertTrue(
            {"寝坊する", "ねぼうする", "寝坊します", "ねぼうします"}
            <= set(nebou["answers"])
        )

        gaishutsu = next(word for word in words if word["original"] == "外出する")
        self.assertEqual(gaishutsu["accent"], "[0]")
        self.assertEqual(gaishutsu["transitivity"], "自动词")
        self.assertTrue(
            {"外出する", "がいしゅつする", "外出します", "がいしゅつします"}
            <= set(gaishutsu["answers"])
        )


if __name__ == "__main__":
    unittest.main()
