/**
 * Map a Latin (QWERTY) keyboard key to its Macedonian Cyrillic equivalent,
 * following the standard Macedonian keyboard layout. Unknown keys are
 * returned unchanged.
 */
export function mapToCyrillic(key: string): string {
  const map: { [key: string]: string } = {
    'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д', 'K': 'К',
    'E': 'Е', 'Z': 'З', 'I': 'И', 'J': 'Ј', 'L': 'Л', 'M': 'М',
    'N': 'Н', 'O': 'О', 'P': 'П', 'R': 'Р', 'S': 'С', 'T': 'Т',
    'U': 'У', 'F': 'Ф', 'H': 'Х', 'C': 'Ц'
  };
  return map[key] || key;
}
