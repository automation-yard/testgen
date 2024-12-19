export function extractCode(response: string): string {
  // Remove any markdown code blocks and extract code
  const codeBlockRegex = /\`\`\`(?:javascript|typescript)?\n([\s\S]*?)\`\`\`/g;
  let code = response;

  // Remove code blocks if present
  if (codeBlockRegex.test(response)) {
    code = response.replace(codeBlockRegex, '$1');
  }

  // Remove any markdown or extra text
  code = code.replace(/^\s*[\*\-]\s+.*$/gm, ''); // Remove bullet points
  code = code.trim();

  return code;
}
