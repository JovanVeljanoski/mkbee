#!/usr/bin/env python3
import json
import os
import sys
from filter_and_export import selector

def main():
    # Adjust path to the dictionary file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dict_path = os.path.join(script_dir, '..', 'data', 'mk_words.json')

    if not os.path.exists(dict_path):
        print(f"Error: Dictionary not found at {dict_path}")
        return

    print("📖 Loading dictionary...")
    with open(dict_path, 'r', encoding='utf-8') as f:
        words = json.load(f)
    print(f"✅ Loaded {len(words)} words.")

    print("\n--- Spelling Bee Puzzle Tester ---")

    while True:
        try:
            central = input("\nEnter central letter (or 'q' to quit): ").strip().lower()
            if central == 'q':
                break

            if len(central) != 1:
                print("Error: Please enter exactly one central letter.")
                continue

            others_input = input("Enter the other 6 letters (separated by space or just together): ").strip().lower()
            # Clean up input: remove spaces and non-alpha characters
            others = [c for c in others_input if c.isalpha()]

            if len(others) != 6:
                print(f"Error: You entered {len(others)} letters, but 6 are required.")
                continue

            print(f"\nSearching for words using '{central}' (must have) and {others}...")

            valid_words = selector(must_have=central, optional=others, words=words)

            # Sort words by length, then alphabetically
            valid_words.sort(key=lambda w: (len(w), w))

            if not valid_words:
                print("No words found!")
            else:
                print(f"\nFound {len(valid_words)} words:")
                # Group by length for better display
                words_by_len = {}
                for w in valid_words:
                    l = len(w)
                    if l not in words_by_len:
                        words_by_len[l] = []
                    words_by_len[l].append(w)

                for length in sorted(words_by_len.keys()):
                    print(f"\n{length} letters ({len(words_by_len[length])} words):")
                    # Print words in columns
                    current_len_words = words_by_len[length]
                    for i in range(0, len(current_len_words), 5):
                        print("  " + ", ".join(current_len_words[i:i+5]))

                # Check for pangrams (using all 7 letters)
                all_letters = set([central] + others)
                pangrams = [w for w in valid_words if set(w) == all_letters]
                if pangrams:
                    print(f"\n🌟 Pangrams found ({len(pangrams)}):")
                    for p in pangrams:
                        print(f"   {p.upper()}")

        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
