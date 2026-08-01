/**
 * Copy text to clipboard with a fallback for older browsers / non-secure contexts.
 * @returns true if the copy succeeded
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  // Fallback for older browsers or non-secure contexts
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    document.body.removeChild(textArea);
    return false;
  }
}
