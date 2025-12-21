#!/usr/bin/env python3
"""
Wordlist cleaner and exporter.
Cleans raw wordlist by removing unwanted characters and short words.
Optimized for performance and minimal file size.

Usage:
    # Clean raw wordlist:
    python3 filter_and_export.py

    # Use in code for Spelling Bee game:
    from filter_and_export import selector, export_words

    # Load cleaned wordlist
    with open('mk_words.json') as f:
        words = json.load(f)

    # Filter for Spelling Bee game
    game_words = selector(must_have='е', optional=['б', 'х', 'н', 'о', 'ј'], words=words)
    export_words(game_words, 'game_words.json')
"""
import json
import os
from typing import List


def clean_wordlist(words: List[str], min_length: int = 4) -> List[str]:
    """
    Clean wordlist by removing unwanted patterns.

    Cleaning steps:
    1. Lowercase everything
    2. Remove duplicates
    3. Remove words with "-"
    4. Remove words with "~"
    5. Remove words with "'" (apostrophe)
    6. Remove words shorter than min_length

    Args:
        words: List of raw words to clean
        min_length: Minimum word length to keep (default: 4)

    Returns:
        List of cleaned words
    """
    cleaned = []
    seen = set()

    print(f"Initial wordlist: {len(words)} words")

    for word in words:
        # Lowercase
        word = word.lower()

        # Skip if already seen (duplicates)
        if word in seen:
            continue

        # Skip words with unwanted characters (hyphen, tilde, apostrophes)
        if '-' in word or '~' in word or "'" in word or '\u2019' in word:
            continue

        # Skip short words
        if len(word) < min_length:
            continue

        # Add to results
        cleaned.append(word)
        seen.add(word)

    print(f"After cleaning: {len(cleaned)} words")
    print(f"  - Removed {len(words) - len(cleaned)} words")
    print(f"  - Removed {len(set(w.lower() for w in words)) - len(seen)} duplicates")

    return cleaned


def selector(must_have: str, optional: List[str], words: List[str], min_length: int = 4) -> List[str]:
    """
    Filter words for Spelling Bee game.

    Rules:
    - Must contain the `must_have` letter
    - Can only use letters from {must_have} + {optional}
    - Must be at least `min_length` characters long

    Args:
        must_have: Required letter (e.g., 'е')
        optional: List of optional letters (e.g., ['б', 'х', 'н', 'о', 'ј'])
        words: List of words to filter
        min_length: Minimum word length (default: 4)

    Returns:
        List of valid words for the game
    """
    must_have = must_have.lower()
    allowed_letters = set([must_have] + [l.lower() for l in optional])

    valid_words = []
    for word in words:
        word = word.lower()

        # Must be long enough and contain required letter
        if len(word) < min_length or must_have not in word:
            continue

        # Must only use allowed letters
        if set(word).issubset(allowed_letters):
            valid_words.append(word)

    return valid_words


def export_words(words: List[str], filename: str = 'filtered_words.json'):
    """
    Export words to optimized JSON file.

    Key optimizations:
    - ensure_ascii=False: Keeps Cyrillic as 2-byte UTF-8 (not 6-byte \\uXXXX)
    - separators=(',', ':'): Removes all whitespace

    This reduces file size by ~60% for Cyrillic text.
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, separators=(',', ':'))

    size_mb = os.path.getsize(filename) / (1024 * 1024)
    print(f"✅ Exported {len(words)} words to {filename}")
    print(f"📊 File size: {size_mb:.2f} MB")
    return size_mb


def main():
    """Main execution."""
    # Configuration
    INPUT_FILE = 'raw_wordlist.json'
    OUTPUT_FILE = 'mk_words.json'
    MIN_LENGTH = 4  # Minimum word length

    # Load raw wordlist
    print(f"📖 Loading {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        raw_words = json.load(f)

    raw_size = os.path.getsize(INPUT_FILE) / (1024 * 1024)
    print(f"   {len(raw_words)} words, {raw_size:.2f} MB")

    # Clean words
    print(f"\n🧹 Cleaning wordlist (removing duplicates, hyphens, tildes, apostrophes, short words)...")
    cleaned_words = clean_wordlist(raw_words, MIN_LENGTH)

    # Export
    print(f"\n💾 Exporting to {OUTPUT_FILE}...")
    export_size = export_words(cleaned_words, OUTPUT_FILE)

    # Stats
    print(f"\n📈 Summary:")
    print(f"   Words: {len(raw_words)} → {len(cleaned_words)} ({len(cleaned_words)/len(raw_words)*100:.1f}%)")
    print(f"   Size: {raw_size:.2f} MB → {export_size:.2f} MB ({export_size/raw_size*100:.1f}%)")

    # Show sample
    print(f"\n📝 Sample words (first 10):")
    for word in cleaned_words[:10]:
        print(f"   {word}")


if __name__ == "__main__":
    main()

