import sudachipy
from sudachipy import dictionary
from sudachipy import tokenizer
from typing import List, Dict, Any

class SudachiTokenizer:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SudachiTokenizer, cls).__new__(cls)
            # Initialize Sudachi
            cls._instance.dic = dictionary.Dictionary(dict="full")
            cls._instance.tokenizer_obj = cls._instance.dic.create()
        return cls._instance

    def tokenize(self, text: str, mode: str = "B") -> List[Dict[str, Any]]:
        if not text:
            return []
            
        split_mode = getattr(tokenizer.Tokenizer.SplitMode, mode.upper(), tokenizer.Tokenizer.SplitMode.B)
        
        tokens = self.tokenizer_obj.tokenize(text, split_mode)
        results = []
        
        for m in tokens:
            # POS is a tuple of 6 elements: (POS1, POS2, POS3, POS4, ConjugationType, ConjugationForm)
            pos = m.part_of_speech()
            results.append({
                "surface": m.surface(),
                "dictionary_form": m.dictionary_form(),
                "reading": m.reading_form(),
                "pos": pos,
                "normalized_form": m.normalized_form()
            })
            
        return results

    def get_sentences(self, text: str) -> List[str]:
        # Simple sentence splitting logic (can be improved)
        import re
        sentences = re.split(r'([。！？\n])', text)
        res = []
        for i in range(0, len(sentences)-1, 2):
            res.append(sentences[i] + sentences[i+1])
        if len(sentences) % 2 != 0 and sentences[-1]:
            res.append(sentences[-1])
        return [s.strip() for s in res if s.strip()]

tokenizer_service = SudachiTokenizer()
